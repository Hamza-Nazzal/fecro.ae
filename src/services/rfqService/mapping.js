// src/services/rfqService/mapping.js
import { rfqDbToJs } from "../../utils/mappers";

/** Convert rfq_item_specs[] → { key_norm: "value unit?" } */
function specRowsToObject(rows = []) {
  const out = {};
  for (const r of rows || []) {
    if (!r) continue;
    const k = (r.key_norm || "").trim();
    const val = (r.value ?? "").toString().trim();
    if (!k || !val) continue;
    const unit = (r.unit ?? "").toString().trim();
    out[k] = unit ? `${val} ${unit}` : val;
  }
  return out;
}

function mapItemRow(row = {}) {
  const specs = specRowsToObject(row.rfq_item_specs || []);
  return {
    id: row.id ?? null,
    rfqId: row.rfq_id ?? null,
    productName: row.product_name ?? "",
    category: row.category ?? "",
    categoryPath: row.category_path ?? "",
    barcode: row.barcode ?? "",
    quantity: row.quantity ?? "",
    purchaseType: row.purchase_type ?? "one-time",
    specifications: specs,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

/** Final UI shape: rfq (mapped) + items[] mapped */
export function mapRFQRow(row = {}) {
  const base = rfqDbToJs(row);
  base.items = Array.isArray(row.rfq_items) ? row.rfq_items.map(mapItemRow) : [];


  const first = base.items?.[0] || {};
  if (base.quantity == null) base.quantity = first.quantity ?? null;
  if (!base.categoryPath) base.categoryPath = first.category_path ?? null;
  if (!base.category) base.category = first.category ?? null;

  
  return base;
}
