// src/services/backends/local-idb/specs.js
import db from "./db";
import { makeUUID } from "../../ids";
import { _normalizeKey, _splitValueUnit, _normKeyPair } from "./utils";
import { getRFQ } from "./rfqs";

/**
 * Add or upsert a spec for an RFQ item.
 * If (rfq_item_id, key_norm) exists, it updates the row; otherwise creates one.
 */
export async function addSpec({ rfqId, itemId, key, label, value, unit = null }) {
  const { key_norm, key_label: defaultLabel } = _normKeyPair(key);
  const { value: v0, unit: u0 } = _splitValueUnit(value);
  const v = (v0 ?? "").toString().trim();
  const u = unit ?? u0 ?? null;

  if (!key_norm || !v) return await getRFQ(rfqId);

  const existing = await db.rfq_item_specs
    .where("[rfq_item_id+key_norm]")
    .equals([itemId, key_norm])
    .first();

  const id = existing?.id || makeUUID();
  const now = new Date().toISOString();

  await db.rfq_item_specs.put({
    id,
    rfq_item_id: itemId,
    key_norm,
    key_label: label ?? defaultLabel,
    value: v,
    unit: u,
    created_at: existing?.created_at || now,
    updated_at: now,
  });

  return await getRFQ(rfqId);
}

/**
 * Update a spec's value/unit by key. Empty value → delete.
 */
export async function updateSpec({ rfqId, itemId, key, value, unit = null }) {
  const key_norm = _normalizeKey(key);
  if (!key_norm) return await getRFQ(rfqId);

  const { value: v0, unit: u0 } = _splitValueUnit(value);
  const v = (v0 ?? "").toString().trim();
  const u = unit ?? u0 ?? null;

  const now = new Date().toISOString();

  if (!v) {
    // Treat empty as delete
    const existing = await db.rfq_item_specs
      .where("[rfq_item_id+key_norm]")
      .equals([itemId, key_norm])
      .first();
    if (existing) await db.rfq_item_specs.delete(existing.id);
    return await getRFQ(rfqId);
  }

  const existing = await db.rfq_item_specs
    .where("[rfq_item_id+key_norm]")
    .equals([itemId, key_norm])
    .first();

  const id = existing?.id || makeUUID();

  await db.rfq_item_specs.put({
    id,
    rfq_item_id: itemId,
    key_norm,
    key_label: existing?.key_label ?? key, // keep prior label if present
    value: v,
    unit: u,
    created_at: existing?.created_at || now,
    updated_at: now,
  });

  return await getRFQ(rfqId);
}

/**
 * Remove a spec by key.
 */
export async function removeSpec({ rfqId, itemId, key }) {
  const key_norm = _normalizeKey(key);
  if (!key_norm) return await getRFQ(rfqId);

  const existing = await db.rfq_item_specs
    .where("[rfq_item_id+key_norm]")
    .equals([itemId, key_norm])
    .first();

  if (existing) await db.rfq_item_specs.delete(existing.id);

  return await getRFQ(rfqId);
}
