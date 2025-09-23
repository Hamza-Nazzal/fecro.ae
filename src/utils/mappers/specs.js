// src/utils/mappers/specs.js

// Build a { [key_norm]: { key_label, value, unit } } from rfq_item_specs rows
export function specsRowsToObject(rows = []) {
  const obj = {};
  for (const r of rows || []) {
    if (!r || !r.key_norm) continue;
    obj[r.key_norm] = {
      key_label: r.key_label ?? r.key_norm,
      value: r.value ?? "",
      unit: r.unit ?? null,
    };
  }
  return obj;
}
