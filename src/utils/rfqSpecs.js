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

/**
 * Normalize a specs payload (array or object) into
 * [{ key_norm, key_label, value, unit }] and drop empty values.
 */
export function normalizeSpecsInput(specs) {
  if (!specs) return []

  const normalized = new Map()

  const push = (maybeSpec) => {
    if (!maybeSpec || typeof maybeSpec !== "object") return

    const keyNormRaw = maybeSpec.key_norm ?? maybeSpec.keyNorm ?? ""
    const keyLabelRaw = maybeSpec.key_label ?? maybeSpec.key ?? maybeSpec.label ?? ""

    const pair = (() => {
      const labelStr = String(keyLabelRaw ?? "").trim()
      const normFromRaw = normalizeKey(keyNormRaw || labelStr)
      if (!normFromRaw) return null
      const key_label = labelStr || formatKey(normFromRaw)
      return { key_norm: normFromRaw, key_label }
    })()

    if (!pair) return

    const valueStr = String(maybeSpec.value ?? maybeSpec.val ?? maybeSpec.display ?? "").trim()
    if (!valueStr) return

    const unitCandidate = maybeSpec.unit ?? maybeSpec.units ?? null
    const unitStr = unitCandidate == null ? null : String(unitCandidate).trim() || null

    normalized.set(pair.key_norm, {
      key_norm: pair.key_norm,
      key_label: pair.key_label,
      value: valueStr,
      unit: unitStr,
    })
  }

  if (Array.isArray(specs)) {
    for (const spec of specs) push(spec)
  } else if (typeof specs === "object") {
    for (const [rawLabel, rawValue] of Object.entries(specs || {})) {
      if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
        push({ key_label: rawLabel, ...rawValue })
        continue
      }

      const { value, unit } = splitValueUnit(rawValue)
      const { key_norm, key_label } = makeKeyPair(rawLabel)
      if (!key_norm || !value) continue
      normalized.set(key_norm, { key_norm, key_label, value, unit })
    }
  }

  return Array.from(normalized.values())
}
