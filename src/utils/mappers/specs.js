// src/utils/mappers/specs.js

// Build a { [key_norm]: { key_label, value, unit } } from rfq_item_specs rows
export function specsRowsToObject(rows = []) {
  const obj = {};
  for (const r of rows || []) {
    if (!r) continue;
    const key_norm = (r.key_norm ?? "").toString().trim();
    const value = (r.value ?? "").toString().trim();
    if (!key_norm || !value) continue;
    const unit = (r.unit ?? "").toString().trim() || null;
    const key_label = (r.key_label ?? r.key_norm ?? "").toString().trim() || key_norm;
    obj[key_norm] = {
      key_norm,
      key_label,
      value,
      unit,
    };
  }
  return obj;
}
