// src/utils/rfqSpecs.js
// Centralized helpers for RFQ item specifications.
// Use these in the UI (e.g., SpecsSection) and services (Supabase/IndexedDB).

/**
 * normalizeKey(" Weight  Capacity ") -> "weight_capacity"
 * normalizeKey("Color") -> "color"
 */
export function normalizeKey(src = "") {
  return String(src || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
}

/**
 * formatKey("weight_capacity") -> "Weight Capacity"
 * formatKey("ip") -> "Ip"
 */
export function formatKey(keyNorm = "") {
  const s = String(keyNorm || "").replace(/_/g, " ").trim()
  if (!s) return ""
  return s
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ")
}

/**
 * splitValueUnit("180 cm") -> { value: "180", unit: "cm" }
 * splitValueUnit("Blue")   -> { value: "Blue", unit: null }
 * splitValueUnit(180)      -> { value: "180", unit: null }
 */
export function splitValueUnit(input) {
  if (input == null) return { value: "", unit: null }
  const s = String(input).trim()
  if (!s) return { value: "", unit: null }
  const m = s.match(/^(-?\d+(?:\.\d+)?)\s*(.+)$/)
  if (m) return { value: m[1], unit: (m[2] || "").trim() || null }
  return { value: s, unit: null }
}

/**
 * joinValueUnit("180", "cm") -> "180 cm"
 * joinValueUnit("Blue", null) -> "Blue"
 */
export function joinValueUnit(value, unit) {
  const v = value == null ? "" : String(value).trim()
  const u = unit == null ? "" : String(unit).trim()
  if (!v) return ""
  return u ? `${v} ${u}` : v
}

/**
 * Returns true if value is effectively empty after trimming.
 */
export function isEmptySpecValue(v) {
  return !String(v ?? "").trim()
}

/**
 * Given a raw UI label (possibly messy), return { key_norm, key_label }.
 * If label is empty, key_label falls back to key_norm.
 */
export function makeKeyPair(label = "") {
  const key_label = String(label ?? "").trim()
  const key_norm = normalizeKey(key_label)
  return { key_norm, key_label: key_label || key_norm }
}

/**
 * Optional: a small allowlist of units you might show in a dropdown
 * per normalized key. Expand as you wish in the UI.
 */
export const COMMON_UNITS = {
  height: ["mm", "cm", "m", "inch", "ft"],
  width: ["mm", "cm", "m", "inch", "ft"],
  length: ["mm", "cm", "m", "inch", "ft"],
  weight: ["g", "kg", "lb"],
  capacity: ["ml", "l", "g", "kg"],
  voltage: ["V"],
  current: ["A", "mA"],
  power: ["W", "kW"],
}

/**
 * Whether this key typically uses a unit (can be used by the UI to decide
 * showing the (value + unit) dual-input vs a single input or select).
 */
export function keyUsuallyHasUnit(keyNorm) {
  const k = normalizeKey(keyNorm)
  return Boolean(COMMON_UNITS[k])
}
