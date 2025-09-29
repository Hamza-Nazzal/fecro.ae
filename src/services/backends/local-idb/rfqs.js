// src/services/backends/local-idb/rfqs.js
import db from "./db";
import { makeUUID } from "../../ids";
import { rfqJsToDb, rfqDbToJs } from "../../utils/mappers";
import { _splitValueUnit, _normKeyPair } from "./utils";

/**
 * Build a full RFQ (items + specs), then convert to JS shape via mapper.
 */
async function _hydrateRFQ(rfqRow) {
  const items = await db.rfq_items.where("rfq_id").equals(rfqRow.id).toArray();
  const outItems = [];

  for (const it of items) {
    const specs = await db.rfq_item_specs.where("rfq_item_id").equals(it.id).toArray();

    // Build a display-friendly specifications object.
    // Prefer key_label when present, else key_norm.
    const specifications = {};
    for (const s of specs) {
      if (!s?.key_norm) continue;
      const key_norm = s.key_norm;
      const key_label = s.key_label || s.key_norm;
      const value = (s.value ?? "").toString().trim();
      if (!value) continue;
      const unit = (s.unit ?? "").toString().trim() || null;
      specifications[key_norm] = { key_norm, key_label, value, unit };
    }

    outItems.push({
      id: it.id,
      productName: it.product_name || "",
      category: it.category ?? null,
      categoryPath: it.category_path ?? null,
      barcode: it.barcode ?? null,
      quantity: it.quantity ?? 1,
      purchaseType: it.purchase_type ?? null,
      specifications,
      created_at: it.created_at,
      updated_at: it.updated_at,
    });
  }

  const rfqJs = rfqDbToJs({ ...rfqRow });
  rfqJs.items = outItems;
  return rfqJs;
}

/**
 * Create an RFQ with items and specs (atomic).
 */
export async function createRFQ(rfq) {
  const now = new Date().toISOString();

  return await db.transaction(
    "rw",
    db.rfqs,
    db.rfq_items,
    db.rfq_item_specs,
    async () => {
      // Insert RFQ (excluding items)
      const row = rfqJsToDb({ ...rfq });
      const rfqId = row.id || makeUUID();
      row.id = rfqId;
      row.created_at = row.created_at || now;
      row.updated_at = row.updated_at || now;
      await db.rfqs.put(row);

      const uiItems = Array.isArray(rfq.items) ? rfq.items : [];
      for (const it of uiItems) {
        const itemId = it.id || makeUUID();
        await db.rfq_items.put({
          id: itemId,
          rfq_id: rfqId,
          product_name: it.productName ?? it.product_name ?? "",
          category: it.category ?? null,
          category_path: it.categoryPath ?? it.category_path ?? null,
          barcode: it.barcode ?? null,
          quantity: it.quantity ?? 1,
          purchase_type: it.purchaseType ?? it.purchase_type ?? null,
          created_at: now,
          updated_at: now,
        });

        const entries = Object.entries(it.specifications || {});
        for (const [rawKey, rawVal] of entries) {
          const rawSpec = rawVal && typeof rawVal === "object" ? rawVal : null;
          const { key_norm, key_label } = _normKeyPair(rawSpec?.key_label ?? rawKey);
          const valueCandidate = rawSpec?.value ?? rawVal;
          const unitCandidate = rawSpec?.unit ?? null;
          let valueStr = (valueCandidate ?? "").toString().trim();
          let unit = unitCandidate == null ? null : unitCandidate.toString().trim() || null;

          if (!valueStr) {
            const parsed = _splitValueUnit(rawVal);
            valueStr = parsed.value;
            unit = unit || parsed.unit;
          }

          if (!key_norm || !valueStr) continue;

          // Enforce (rfq_item_id, key_norm) uniqueness in code
          const existing = await db.rfq_item_specs
            .where("[rfq_item_id+key_norm]")
            .equals([itemId, key_norm])
            .first();

          const id = existing?.id || makeUUID();
          await db.rfq_item_specs.put({
            id,
            rfq_item_id: itemId,
            key_norm,
            key_label,
            value: valueStr,
            unit,
            created_at: existing?.created_at || now,
            updated_at: now,
          });
        }
      }

      const fresh = await db.rfqs.get(rfqId);
      return await _hydrateRFQ(fresh);
    }
  );
}

/**
 * Patch an RFQ. If items are provided, upsert items and reconcile specs.
 * Specs are only touched when the item object includes "specifications".
 */
export async function updateRFQ(id, updates) {
  return await db.transaction(
    "rw",
    db.rfqs,
    db.rfq_items,
    db.rfq_item_specs,
    async () => {
      // Patch RFQ (exclude items)
      const patch = rfqJsToDb({ ...updates });
      delete patch.items;
      if (Object.keys(patch).length) {
        patch.updated_at = new Date().toISOString();
        await db.rfqs.update(id, patch);
      }

      const uiItems = Array.isArray(updates.items) ? updates.items : null;
      if (uiItems && uiItems.length) {
        const now = new Date().toISOString();
        for (const it of uiItems) {
          const itemId = it.id || makeUUID();
          await db.rfq_items.put({
            id: itemId,
            rfq_id: id,
            product_name: it.productName ?? it.product_name ?? "",
            category: it.category ?? null,
            category_path: it.categoryPath ?? it.category_path ?? null,
            barcode: it.barcode ?? null,
            quantity: it.quantity ?? 1,
            purchase_type: it.purchaseType ?? it.purchase_type ?? null,
            updated_at: now,
          });

          // Only touch specs if "specifications" is explicitly present
          const hasSpecs = Object.prototype.hasOwnProperty.call(
            it,
            "specifications"
          );
          if (!hasSpecs) continue;

          const incomingKeys = new Set();
          const entries = Object.entries(it.specifications || {});
          for (const [rawKey, rawVal] of entries) {
            const rawSpec = rawVal && typeof rawVal === "object" ? rawVal : null;
            const { key_norm, key_label } = _normKeyPair(rawSpec?.key_label ?? rawKey);
            const valueCandidate = rawSpec?.value ?? rawVal;
            const unitCandidate = rawSpec?.unit ?? null;
            let valueStr = (valueCandidate ?? "").toString().trim();
            let unit = unitCandidate == null ? null : unitCandidate.toString().trim() || null;

            if (!valueStr) {
              const parsed = _splitValueUnit(rawVal);
              valueStr = parsed.value;
              unit = unit || parsed.unit;
            }

            if (!key_norm || !valueStr) continue;
            incomingKeys.add(key_norm);

            const existing = await db.rfq_item_specs
              .where("[rfq_item_id+key_norm]")
              .equals([itemId, key_norm])
              .first();

            const idSpec = existing?.id || makeUUID();
            await db.rfq_item_specs.put({
              id: idSpec,
              rfq_item_id: itemId,
              key_norm,
              key_label,
              value: valueStr,
              unit,
              created_at: existing?.created_at || now,
              updated_at: now,
            });
          }

          // Remove specs that were omitted by the caller (parity with RPC semantics)
          const existingForItem = await db.rfq_item_specs
            .where("rfq_item_id")
            .equals(itemId)
            .toArray();

          const toDelete = existingForItem.filter(
            (r) => !incomingKeys.has(r.key_norm)
          );
          if (toDelete.length) {
            await db.rfq_item_specs.bulkDelete(toDelete.map((r) => r.id));
          }
        }
      }

      const fresh = await db.rfqs.get(id);
      return await _hydrateRFQ(fresh);
    }
  );
}

/**
 * Delete an RFQ and cascade to items/specs.
 */
export async function deleteRFQ(id) {
  const items = await db.rfq_items.where("rfq_id").equals(id).toArray();
  const itemIds = items.map((i) => i.id);
  const specs = itemIds.length
    ? await db.rfq_item_specs.where("rfq_item_id").anyOf(itemIds).toArray()
    : [];

  await db.transaction(
    "rw",
    db.rfq_item_specs,
    db.rfq_items,
    db.rfqs,
    async () => {
      if (specs.length) await db.rfq_item_specs.bulkDelete(specs.map((s) => s.id));
      if (items.length) await db.rfq_items.bulkDelete(itemIds);
      await db.rfqs.delete(id);
    }
  );

  return true;
}

/**
 * Get a single RFQ (hydrated).
 */
export async function getRFQ(id) {
  const r = await db.rfqs.get(id);
  if (!r) return null;
  return await _hydrateRFQ(r);
}

/**
 * List RFQs with optional filters (open/userId/search). Sorted by posted_time desc.
 */
export async function listRFQs({ onlyOpen, userId, search } = {}) {
  const rows = await db.rfqs.orderBy("posted_time").reverse().toArray();

  const filtered = rows.filter((r) => {
    if (onlyOpen && r.status !== "active") return false;
    if (userId && r.user_id !== userId) return false;
    if (
      search &&
      !String(r.title || "")
        .toLowerCase()
        .includes(String(search).toLowerCase())
    )
      return false;
    return true;
  });

  const out = [];
  for (const r of filtered) out.push(await _hydrateRFQ(r));
  return out;
}

/**
 * List RFQs for a user, sorted by posted_time desc.
 * (Dexie note: where(...).equals(...).toArray() then sort in JS to keep it simple.)
 */
export async function listMyRFQs(userId) {
  const rows = await db.rfqs.where("user_id").equals(userId).toArray();
  rows.sort((a, b) => {
    const ax = a.posted_time || "";
    const bx = b.posted_time || "";
    return ax < bx ? 1 : ax > bx ? -1 : 0; // desc
  });

  const out = [];
  for (const r of rows) out.push(await _hydrateRFQ(r));
  return out;
}
