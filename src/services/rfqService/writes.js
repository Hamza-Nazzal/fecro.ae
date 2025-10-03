// src/services/rfqService/writes.js
import { supabase } from "../backends/supabase";
import { getCurrentUserCached } from "../backends/supabase/auth";
import { upsertRfqItemSpecs } from "../backends/supabase/rfqs/items";
import { rfqJsToDb } from "../../utils/mappers";
import { normalizeSpecsInput } from "../../utils/rfq/rfqSpecs";
import { getRFQ } from "./reads";

/** Normalize one UI item payload for RPC upsert */
function normalizeItemForRPC(it, { rfqId, allowId = false } = {}) {
  const name = it.productName ?? it.product_name ?? it.name ?? "";
  const categoryPath = it.categoryPath ?? it.category_path ?? it.category ?? "";
  const quantity = it.quantity ?? it.qty ?? 1;
  const purchaseType = it.purchaseType ?? it.orderType ?? "one-time";
  const barcode = it.barcode ?? null;
  const specsInput = it.specifications ?? null;
  const normalizedSpecs = normalizeSpecsInput(specsInput);
  const specifications = normalizedSpecs.length ? normalizedSpecs : null;

  const out = {
    product_name: name,
    category_path: categoryPath,
    quantity,
    purchase_type: purchaseType,
    barcode: barcode || null,
    specifications,
  };
  if (allowId && it.id) out.id = it.id;
  if (rfqId) out.rfq_id = rfqId; // harmless; RPC can ignore if it uses _rfq_id
  return out;
}

function prepareItemsForSpecs(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (!item || typeof item !== "object") return item;
    const rawSpecs = Array.isArray(item.specs)
      ? item.specs
      : item.specifications ?? item.specs;
    const specsArray = normalizeSpecsInput(rawSpecs);
    if (!specsArray.length) return item;
    return { ...item, specs: specsArray };
  });
}

function hasPersistableSpecs(items) {
  if (!Array.isArray(items)) return false;
  return items.some((item) => {
    if (!item || typeof item !== "object") return false;
    const rfqItemId = item.id ?? item.rfq_item_id ?? item.item_id;
    return Boolean(rfqItemId) && Array.isArray(item.specs) && item.specs.length > 0;
  });
}

/** Create RFQ + RPC upsert of items/specs (then return hydrated) */
export async function createRFQ(rfq) {
  const user = await getCurrentUserCached();
  if (!user) throw new Error("Please sign in before submitting an RFQ.");

  // 1) insert base row (no items)
  const baseRow = rfqJsToDb(rfq);
  delete baseRow.items;
  delete baseRow.id;
  delete baseRow.user_id;
  delete baseRow.userId;
  delete baseRow.created_at;

  const { data: rfqRow, error: rfqErr } = await supabase
    .from("rfqs")
    .insert([baseRow])
    .select("id")
    .single();
  if (rfqErr) throw rfqErr;

  const rfqId = rfqRow.id;

  // 2) atomic children via RPC
  const uiItems = Array.isArray(rfq.items) ? rfq.items : [];
  if (uiItems.length) {
    const cleanItems = uiItems.map((it) => normalizeItemForRPC(it, { rfqId, allowId: false }));
    console.log("[rfq_upsert] items payload ->", JSON.stringify(cleanItems, null, 2));
    const { data: rpcItems, error: rpcErr } = await supabase.rpc("rfq_upsert_items_and_specs", {
      _rfq_id: rfqId,
      _items: cleanItems,
    });
    if (rpcErr) {
      console.error("[rpc] rfq_upsert_items_and_specs failed:", rpcErr);
    } else {
      console.log("[rpc] rfq_upsert_items_and_specs ok:");
    }
    if (rpcErr) {
      // compensating delete avoids orphan rfqs
      await supabase.from("rfqs").delete().eq("id", rfqId);
      throw rpcErr;
    }

    const itemsForSpecs = prepareItemsForSpecs(rpcItems);
    if (hasPersistableSpecs(itemsForSpecs)) {
      try {
        await upsertRfqItemSpecs(rfqId, itemsForSpecs, supabase);
      } catch (specErr) {
        await supabase.from("rfqs").delete().eq("id", rfqId);
        throw specErr;
      }
    }
  }

  // 3) return hydrated
  return await getRFQ(rfqId);
}

/** Update base fields + optional RPC upsert of items/specs (then hydrated) */
export async function updateRFQ(id, updates) {
  const user = await getCurrentUserCached();
  if (!user) throw new Error("Please sign in before updating an RFQ.");

  // A) patch top-level
  const basePatch = rfqJsToDb(updates);
  delete basePatch.items;
  if (Object.keys(basePatch).length) {
    const { error: rfqErr } = await supabase.from("rfqs").update(basePatch).eq("id", id);
    if (rfqErr) throw rfqErr;
  }

  // B) atomic children via RPC (only if items supplied)
  if (Array.isArray(updates.items)) {
    const cleaned = updates.items.map((it) => normalizeItemForRPC(it, { rfqId: id, allowId: true }));
    const { data: rpcItems, error: rpcErr } = await supabase.rpc("rfq_upsert_items_and_specs", {
      _rfq_id: id,
      _items: cleaned,
    });
    if (rpcErr) throw rpcErr;

    const itemsForSpecs = prepareItemsForSpecs(
      Array.isArray(rpcItems) && rpcItems.length ? rpcItems : cleaned
    );
    if (hasPersistableSpecs(itemsForSpecs)) {
      await upsertRfqItemSpecs(id, itemsForSpecs, supabase);
    }
  }

  // C) hydrated read
  return await getRFQ(id);
}

/** Manual delete (server may cascade via FK/RLS/trigger) */
export async function deleteRFQ(id) {
  const { error } = await supabase.from("rfqs").delete().eq("id", id);
  if (error) throw error;
  return true;
}
