// src/services/backends/supabase/rfqs/items.js
import { supabase } from "../../supabase.js";
import { makeUUID } from "../../../ids";
import { specsRowsToObject } from "../../../../utils/mappers";

/** Read items for an RFQ (raw DB rows) */
export async function fetchItems(rfqId) {
  const { data, error } = await supabase.from("rfq_items").select("*").eq("rfq_id", rfqId);
  if (error) throw new Error(error.message);
  return data || [];
}

/** Read specs for a list of item IDs (raw DB rows) */
export async function fetchSpecsByItemIds(itemIds = []) {
  if (!itemIds.length) return [];
  const { data, error } = await supabase
    .from("rfq_item_specs")
    .select("*")
    .in("rfq_item_id", itemIds);
  if (error) throw new Error(error.message);
  return data || [];
}

/** Upsert one item; returns itemId */
export async function upsertItem(it, rfqId, nowISO) {
  const itemId = it.id || makeUUID();
  const { error } = await supabase.from("rfq_items").upsert({
    id: itemId,
    rfq_id: rfqId,
    product_name: it.productName ?? it.product_name ?? "",
    category: it.category ?? null,
    category_path: it.categoryPath ?? it.category_path ?? null,
    barcode: it.barcode ?? null,
    quantity: it.quantity ?? 1,
    purchase_type: it.purchaseType ?? it.purchase_type ?? null,
    created_at: it.created_at ?? nowISO,
    updated_at: nowISO,
  });
  if (error) throw new Error(error.message);
  return itemId;
}

/** Upsert all specs for an item; returns Set of incoming key_norm values */
export async function upsertItemSpecs(itemId, specsObject = {}, nowISO) {
  const incoming = new Set();
  for (const [key_norm, payload] of Object.entries(specsObject || {})) {
    const value = (payload?.value ?? "").toString().trim();
    if (!key_norm || !value) continue;
    incoming.add(key_norm);

    const { data: existing } = await supabase
      .from("rfq_item_specs")
      .select("id, created_at")
      .eq("rfq_item_id", itemId)
      .eq("key_norm", key_norm)
      .maybeSingle();

    const id = existing?.id || makeUUID();
    const { error } = await supabase.from("rfq_item_specs").upsert({
      id,
      rfq_item_id: itemId,
      key_norm,
      key_label: payload?.key_label ?? key_norm,
      value,
      unit: payload?.unit ?? null,
      created_at: existing?.created_at || nowISO,
      updated_at: nowISO,
    });
    if (error) throw new Error(error.message);
  }
  return incoming;
}

/** Delete any specs NOT present in `incoming` (parity with earlier behavior) */
export async function deleteSpecsNotIn(itemId, incomingSet) {
  const { data } = await supabase
    .from("rfq_item_specs")
    .select("id, key_norm")
    .eq("rfq_item_id", itemId);
  const toDelete = (data || []).filter((r) => !incomingSet.has(r.key_norm));
  if (toDelete.length) {
    const { error } = await supabase
      .from("rfq_item_specs")
      .delete()
      .in("id", toDelete.map((r) => r.id));
    if (error) throw new Error(error.message);
  }
}

/** Manual cascade: delete specs + items for an RFQ */
export async function cascadeDeleteItems(rfqId) {
  const { data: items } = await supabase.from("rfq_items").select("id").eq("rfq_id", rfqId);
  const itemIds = (items || []).map((i) => i.id);
  if (itemIds.length) {
    await supabase.from("rfq_item_specs").delete().in("rfq_item_id", itemIds);
    await supabase.from("rfq_items").delete().in("id", itemIds);
  }
}

/** Assemble hydrated items with specs */
export function buildHydratedItems(itemsRows = [], specsRows = []) {
  const byItem = new Map();
  for (const it of itemsRows) {
    const rowsForItem = specsRows.filter((s) => s.rfq_item_id === it.id);
    byItem.set(it.id, specsRowsToObject(rowsForItem));
  }
  return itemsRows.map((it) => ({
    id: it.id,
    productName: it.product_name ?? "",
    category: it.category ?? null,
    categoryPath: it.category_path ?? null,
    barcode: it.barcode ?? null,
    quantity: it.quantity ?? 1,
    purchaseType: it.purchase_type ?? null,
    created_at: it.created_at ?? null,
    updated_at: it.updated_at ?? null,
    specifications: byItem.get(it.id) || {},
  }));
}
