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
          const key_label = String(rawKey || "").trim();
          const key_norm = _normalizeKey(key_label);                // ← use shared normalizer
          if (!key_norm) continue;

          const valStr = (rawVal ?? "").toString().trim();
          if (!valStr) continue;

          const { value, unit } = _splitValueUnit(valStr);          // ← reuse the same splitter
          await tx.table("rfq_item_specs").put({
            id: makeUUID(),
            rfq_item_id: itemId,
            key_norm,
            key_label: key_label || key_norm,
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
