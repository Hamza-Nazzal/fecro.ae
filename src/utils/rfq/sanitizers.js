// src/utils/rfq/sanitizers.js

/**
 * Pure, stateless helpers for shaping RFQ card data.
 * No imports. No I/O. Deterministic transforms only.
 *
 * Conventions (based on current UI usage):
 * - items_preview: string[] (max 5)
 * - items_summary: { name, quantity, specifications?, categoryPath? }[] (max 5)
 * - specifications: { key_norm?, key_label?, value?, unit? }[] (max 2)
 * - quotations_count: number >= 0
 */

const ITEM_PREVIEW_LIMIT = 5;
const SPECS_PER_ITEM_LIMIT = 2;

/** Clamp a number to [min,max] */
function clamp(n, min, max) {
  const x = Number.isFinite(+n) ? +n : min;
  return Math.max(min, Math.min(max, x));
}

/** Safe string trim */
function s(x) {
  return typeof x === "string" ? x.trim() : "";
}

/** True if a value is a non-empty string after trim */
function hasText(x) {
  return s(x).length > 0;
}

/** True if value is a finite number or numeric string */
function isNum(x) {
  return Number.isFinite(+x);
}

/** Build "label: value unit" for preview lines (short) */
function specToInlineText(spec) {
  const label = s(spec?.key_label) || s(spec?.label) || s(spec?.key_norm);
  const val = s(spec?.value);
  const unit = s(spec?.unit);
  if (!label && !val) return "";
  return [label && `${label}:`, val, unit].filter(Boolean).join(" ").trim();
}

/** Normalize 1 spec row/object into canonical { key_norm, key_label, value, unit } */
function normalizeSpec(spec) {
  const key_norm = s(spec?.key_norm) || s(spec?.keyNorm) || s(spec?.key);
  const key_label = s(spec?.key_label) || s(spec?.keyLabel) || s(spec?.label) || key_norm || "";
  const value = s(spec?.value);
  const unit = s(spec?.unit);
  // drop completely empty specs
  if (!key_norm && !key_label && !value && !unit) return null;
  return { key_norm, key_label, value, unit };
}

/**
 * Convert rfq_item_specs[] rows into a compact array of normalized specs.
 * Accepts: array of DB rows or already-shaped spec objects.
 * Returns: normalized spec objects (no duplicates by (key_norm||key_label,value,unit))
 */
export function specRowsToEntries(rows) {
  const out = [];
  const seen = new Set();
  (Array.isArray(rows) ? rows : []).forEach((r) => {
    const n = normalizeSpec(r);
    if (!n) return;
    const sig = [n.key_norm || n.key_label || "", n.value || "", n.unit || ""].join("¦");
    if (seen.has(sig)) return;
    seen.add(sig);
    out.push(n);
  });
  return out;
}

/**
 * Accepts many shapes and returns normalized specs:
 * - array of spec rows/objects
 * - object with `specs` or `specifications`
 */
export function toSpecEntries(source) {
  if (!source) return [];
  if (Array.isArray(source)) return specRowsToEntries(source);
  if (Array.isArray(source?.specs)) return specRowsToEntries(source.specs);
  if (Array.isArray(source?.specifications)) return specRowsToEntries(source.specifications);
  return [];
}

/**
 * Return up to `limit` normalized specs.
 * Keeps order; filters empties.
 */
export function buildSpecRecord(entries, limit = SPECS_PER_ITEM_LIMIT) {
  const arr = specRowsToEntries(entries).slice(0, clamp(limit, 0, 50));
  return arr;
}

/**
 * Build a single preview line for an item.
 * Prefers: "<name> — spec1; spec2"
 * Falls back: "<name>" or "Item"
 */
export function makeItemPreview(itemRow = {}, specEntries = []) {
  const name =
    s(itemRow?.name) ||
    s(itemRow?.product_name) ||
    s(itemRow?.title) ||
    "Item";

  const specs = buildSpecRecord(
    specEntries.length ? specEntries : toSpecEntries(itemRow),
    SPECS_PER_ITEM_LIMIT
  );

  const parts = specs
    .map(specToInlineText)
    .filter(hasText)
    .slice(0, SPECS_PER_ITEM_LIMIT);

  return parts.length ? `${name} — ${parts.join("; ")}` : name;
}

/**
 * Build one summary entry the card understands.
 * Shape: { name, quantity, specifications[], categoryPath? }
 */
export function buildSummaryEntry(itemRow = {}, specEntries = [], opts = {}) {
  const name =
    s(itemRow?.name) ||
    s(itemRow?.product_name) ||
    s(itemRow?.title) ||
    "Item";

  // quantities in your data are sometimes numeric, sometimes strings
  const quantityRaw = itemRow?.quantity ?? itemRow?.qty ?? itemRow?.qty_total;
  const quantity = isNum(quantityRaw) ? +quantityRaw : quantityRaw ?? null;

  const specifications = buildSpecRecord(
    specEntries.length ? specEntries : toSpecEntries(itemRow),
    SPECS_PER_ITEM_LIMIT
  );

  const fallbackCategoryPath =
    s(itemRow?.categoryPath) ||
    s(itemRow?.first_category_path) ||
    s(opts?.fallbackCategoryPath);

  const entry = { name, quantity: quantity ?? null };
  if (specifications.length) entry.specifications = specifications;
  if (fallbackCategoryPath) entry.categoryPath = fallbackCategoryPath;

  return entry;
}

/**
 * items_preview sanitizer.
 * Accepts:
 *   - string[]
 *   - array of item rows (will render to lines with makeItemPreview)
 *   - { items: [...] }
 * Returns: string[] (max 5)
 */
export function sanitizeItemsPreview(source) {
  let items = [];
  if (Array.isArray(source)) {
    items = source;
  } else if (Array.isArray(source?.items)) {
    items = source.items;
  } else if (!source) {
    return [];
  } else {
    // Unknown shape → best effort: wrap single object
    items = [source];
  }

  // If already string[], trim + filter empties
  const allStrings = items.every((x) => typeof x === "string");
  if (allStrings) {
    return items
      .map((t) => s(t))
      .filter(hasText)
      .slice(0, ITEM_PREVIEW_LIMIT);
  }

  // Otherwise, treat as item rows
  const lines = items.map((it) => {
    const specs = toSpecEntries(it);
    return makeItemPreview(it, specs);
  });

  return lines.filter(hasText).slice(0, ITEM_PREVIEW_LIMIT);
}

/**
 * items_summary sanitizer.
 * Accepts:
 *   - array of already-shaped summary entries
 *   - array of item rows ({ name/product_name, quantity, specs/specifications[] })
 *   - { items: [...] }
 * Returns: normalized summary entries[] (max 5)
 */
export function sanitizeItemsSummary(source, fallbackCategoryPath = "") {
  let items = [];
  if (Array.isArray(source)) {
    items = source;
  } else if (Array.isArray(source?.items)) {
    items = source.items;
  } else if (!source) {
    return [];
  } else {
    items = [source];
  }

  // If entries already look like summaries, lightly normalize them
  const lookLikeSummaries = items.every(
    (x) =>
      x &&
      (typeof x === "object") &&
      ("name" in x || "product_name" in x || "title" in x)
  );

  const entries = items.map((it) => {
    const specs = toSpecEntries(it);
    return buildSummaryEntry(it, specs, { fallbackCategoryPath });
  });

  return entries.slice(0, ITEM_PREVIEW_LIMIT);
}

/**
 * quotations_count sanitizer: coerce to >= 0 integer, default 0.
 */
export function sanitizeQuotationsCount(value) {
  if (!Number.isFinite(+value)) return 0;
  const n = Math.floor(+value);
  return n < 0 ? 0 : n;
}

/**
 * seller RFQ ID extractor with tolerant fallbacks.
 * Returns null if not present.
 */
export function getSellerRfqId(row) {
  return (
    s(row?.seller_rfq_id) ||
    s(row?.sellerRfqId) ||
    null
  ) || null;
}