// src/services/rfqService/writes.js
import { supabase } from "../backends/supabase";
import { getCurrentUserCached } from "../backends/supabase/auth";
import { rfqJsToDb } from "../../utils/mappers";
import { getRFQ } from "./reads";

/** Normalize one UI item payload for RPC upsert */
function normalizeItemForRPC(it, { rfqId, allowId = false } = {}) {
  const name = it.productName ?? it.product_name ?? it.name ?? "";
  const categoryPath = it.categoryPath ?? it.category_path ?? it.category ?? "";
  const quantity = it.quantity ?? it.qty ?? 1;
  const purchaseType = it.purchaseType ?? it.orderType ?? "one-time";
  const barcode = it.barcode ?? null;
  const rawSpecs = it.specifications ?? it.specs ?? null;

  // helper to normalize spec keys
    const normKey = (s) =>
      String(s ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      let specifications = null;
        if (Array.isArray(rawSpecs)) {
          // tolerate various shapes
          specifications = rawSpecs.map((s = {}) => ({
            key_label: s.key_label ?? s.key ?? "",
            key_norm: s.key_norm ?? normKey(s.key_label ?? s.key ?? ""),
            value: s.value ?? String(s.val ?? ""),
            unit: s.unit ?? null,
          }));
        } else if (rawSpecs && typeof rawSpecs === "object") {
          // object map -> array of rows
          specifications = Object.entries(rawSpecs).map(([k, v]) => ({
            key_label: k,
            key_norm: normKey(k),
            value: String(v),
            unit: null,
          }));
        }

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
    const { error: rpcErr } = await supabase.rpc("rfq_upsert_items_and_specs", {
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
    const { error: rpcErr } = await supabase.rpc("rfq_upsert_items_and_specs", {
      _rfq_id: id,
      _items: cleaned,
    });
    if (rpcErr) throw rpcErr;
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
