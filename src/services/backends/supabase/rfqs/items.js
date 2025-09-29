// src/services/backends/supabase/rfqs/items.js
import { supabase } from "../../supabase.js";
import { makeUUID } from "../../../ids";
import { specsRowsToObject } from "../../../../utils/mappers";
import { normalizeSpecsInput } from "../../../../utils/rfq/rfqSpecs";

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
export async function upsertItemSpecs(itemId, specsInput = null, nowISO) {
  const incoming = new Set();
  const specs = normalizeSpecsInput(specsInput);
  for (const spec of specs) {
    const { key_norm, key_label, value, unit } = spec;
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
      key_label: key_label || key_norm,
      value,
      unit: unit || null,
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

/** Bulk insert specs for multiple items (used during RFQ creation) */
export async function bulkInsertItemSpecs(itemSpecsMap) {
  const rows = [];
  for (const [itemId, rawSpecs] of Object.entries(itemSpecsMap)) {
    const specs = normalizeSpecsInput(rawSpecs);
    if (!specs.length) continue;

    for (const spec of specs) {
      rows.push({
        rfq_item_id: itemId,
        key_norm: spec.key_norm,
        key_label: spec.key_label || spec.key_norm,
        value: spec.value,
        unit: spec.unit ?? null,
      });
    }
  }

  if (rows.length === 0) return;

  try {
    const { error } = await supabase
      .from('rfq_item_specs')
      .insert(rows, { returning: 'minimal' });
    
    if (error) {
      if (error.code === 'PGRST301' || error.code === 'PGRST116' || 
          error.message?.includes('401') || error.message?.includes('403')) {
        console.warn('rfq_item_specs insert blocked (RLS?):', error.message);
        return; // Don't throw, let RFQ creation continue
      }
      throw error;
    }
  } catch (error) {
    if (error.message?.includes('401') || error.message?.includes('403')) {
      console.warn('rfq_item_specs insert blocked (RLS?):', error.message);
      return; // Don't throw, let RFQ creation continue
    }
    throw error;
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
