// src/services/backends/local-idb/utils.js

/** Normalize a key into a stable identifier (lowercase, underscores, no junk). */
export function _normalizeKey(src = "") {
  return (src || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Split a free-text value into { value, unit } when possible (e.g., "15 cm"). */
export function _splitValueUnit(input) {
  if (input == null) return { value: "", unit: null };
  const s = String(input).trim();
  if (!s) return { value: "", unit: null };
  const m = s.match(/^(-?\d+(?:\.\d+)?)\s*(.+)$/);
  if (m) return { value: m[1], unit: (m[2] || "").trim() || null };
  return { value: s, unit: null };
}

/** Pair a human label with its normalized key. */
export function _normKeyPair(rawKey) {
  const key_label = String(rawKey ?? "").trim();
  const key_norm = _normalizeKey(key_label);
  return { key_norm, key_label: key_label || key_norm };
}
