// src/utils/rfq/itemHelpers.js

/**
 * Helper: consistent item name resolution
 * Tries multiple possible property names to find the item's display name
 */
export function getItemName(it) {
  return it?.productName || it?.name || it?.title || "Item";
}

/**
 * Helper: normalize specs from array or object shape to display format
 * Handles both array of spec objects and object map of specs
 * Returns array of { label, display } objects for rendering
 */
export function toSpecList(specs) {
  if (!specs) return [];
  
  // Handle array format: [{ key_label, value, unit, ... }]
  if (Array.isArray(specs)) {
    return specs
      .map((s) => {
        const label = (s?.key_label || s?.key_norm || s?.label || "").trim();
        const value = s?.value;
        const unit = (s?.unit ?? "").toString().trim();
        if (!label || value === undefined || value === null || String(value).trim() === "") {
          return null;
        }
        const display = unit ? `${value} ${unit}` : String(value);
        return { label, display };
      })
      .filter(Boolean);
  }
  
  // Handle object format: { key_norm: { key_label, value, unit } }
  return Object.entries(specs)
    .map(([key, s]) => {
      const label = (s?.key_label || key || "").trim();
      const value = s?.value;
      const unit = (s?.unit ?? "").toString().trim();
      if (!label || value === undefined || value === null || String(value).trim() === "") {
        return null;
      }
      const display = unit ? `${value} ${unit}` : String(value);
      return { label, display };
    })
    .filter(Boolean);
}

