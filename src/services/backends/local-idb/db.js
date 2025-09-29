// src/services/backends/local-idb/db.js
import Dexie from "dexie";
import { makeUUID } from "../../ids";
import { _normalizeKey, _splitValueUnit } from "./utils";

// Create DB
export const db = new Dexie("fecroDB");

// v1 (legacy): rfqs + quotations (kept for upgrade continuity)
db.version(1).stores({
  rfqs: "id, user_id, posted_time, status, title",
  quotations: "id, rfq_id, seller_id, created_at",
});

// v2: add normalized child stores and migrate embedded item.specifications
db.version(2)
  .stores({
    rfqs: "id, user_id, posted_time, status, title",
    quotations: "id, rfq_id, seller_id, created_at",
    rfq_items: "id, rfq_id", // index by rfq_id
    // compound index to enforce uniqueness per item+key
    rfq_item_specs: "id, rfq_item_id, key_norm, [rfq_item_id+key_norm]",
  })
  .upgrade(async (tx) => {
    const rfqs = await tx.table("rfqs").toArray();
    for (const r of rfqs) {
      const items = Array.isArray(r.items) ? r.items : [];
      if (!items.length) continue;

      for (const it of items) {
        const itemId = it.id || makeUUID();
        await tx.table("rfq_items").put({
          id: itemId,
          rfq_id: r.id,
          product_name: it.productName ?? it.product_name ?? "",
          category: it.category ?? null,
          category_path: it.categoryPath ?? it.category_path ?? null,
          barcode: it.barcode ?? null,
          quantity: it.quantity ?? 1,
          purchase_type: it.purchaseType ?? it.purchase_type ?? null,
          created_at: r.created_at ?? new Date().toISOString(),
          updated_at: r.updated_at ?? new Date().toISOString(),
        });

        const specs = (it.specifications && typeof it.specifications === "object") ? it.specifications : {};
        for (const [rawKey, rawVal] of Object.entries(specs)) {
          const rawSpec = rawVal && typeof rawVal === "object" ? rawVal : null;
          const key_label_input = rawSpec?.key_label ?? rawKey;
          const key_norm_input = rawSpec?.key_norm ?? key_label_input;
          const key_norm = _normalizeKey(key_norm_input);
          if (!key_norm) continue;

          const key_label = String(key_label_input ?? "").trim() || key_norm;
          const baseValue = rawSpec?.value ?? rawVal;
          const baseUnit = rawSpec?.unit ?? null;
          let valStr = (baseValue ?? "").toString().trim();
          let unit = baseUnit == null ? null : baseUnit.toString().trim() || null;

          if (!valStr) {
            const parsed = _splitValueUnit(rawVal);
            valStr = parsed.value;
            unit = unit || parsed.unit;
          }
          if (!valStr) continue;

          const value = valStr;
          await tx.table("rfq_item_specs").put({
            id: makeUUID(),
            rfq_item_id: itemId,
            key_norm,
            key_label,
            value,
            unit,
          });
        }
      }

      delete r.items;
      await tx.table("rfqs").put(r);
    }
  });

export default db;
