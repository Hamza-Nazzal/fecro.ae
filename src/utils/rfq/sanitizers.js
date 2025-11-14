// src/utils/rfq/sanitizers.js

// ---- getSellerRfqId (exact) ----
export function getSellerRfqId(row) {
  return row?.seller_rfq_id || null;
}

// ---- sanitizeItemsPreview (exact) ----
export function sanitizeItemsPreview(values) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const out = [];
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === "string") {
      const str = value.trim();
      if (!str || seen.has(str)) continue;
      seen.add(str);
      out.push(str);
    } else if (typeof value === "object") {
      const key = JSON.stringify(value);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    } else {
      const str = String(value).trim();
      if (!str || seen.has(str)) continue;
      seen.add(str);
      out.push(str);
    }
  }
  return out;
}

/*
// Input: array-like; Output: unique trimmed strings (keeps order)
export function sanitizeItemsPreview(values) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const out = [];
  for (const value of values) {
    if (value == null) continue;
    const str = typeof value === "string" ? value.trim() : String(value).trim();
    if (!str || seen.has(str)) continue;
    seen.add(str);
    out.push(str);
  }
  return out;
}
*/
// ---- sanitizeItemsSummary (exact) ----
// Input: array of entries; Output: array of summaries with:
// { name, qty?, categoryPath: string, specifications: { [label]: display } }
// - name fallback: entry.name/title/productName/item → "Item"
// - qty: numeric > 0 only
// - categoryPath: entry.categoryPath/category_path/category OR fallback param
// - specifications: object map of up to 2 normalized specs (label → "value unit?")
export function sanitizeItemsSummary(entries, fallbackCategoryPath = "") {
  if (!Array.isArray(entries)) return [];
  const out = [];
  const fallback =
    typeof fallbackCategoryPath === "string"
      ? fallbackCategoryPath.trim()
      : String(fallbackCategoryPath ?? "").trim();

  for (const entry of entries) {
    if (!entry || out.length >= 5) break;

    const nameCandidates = [entry?.name, entry?.title, entry?.productName, entry?.item];
    let name = nameCandidates
      .map((candidate) =>
        typeof candidate === "string" ? candidate.trim() : String(candidate ?? "").trim()
      )
      .find(Boolean);
    if (!name) name = "Item";

    const summary = { name };

    const qty = Number(entry?.qty ?? entry?.quantity);
    if (Number.isFinite(qty) && qty > 0) summary.qty = qty;

    const categoryRaw = entry?.categoryPath ?? entry?.category_path ?? entry?.category;
    const category =
      typeof categoryRaw === "string" ? categoryRaw.trim() : String(categoryRaw ?? "").trim();
    const normalizedCategory = category || fallback;
    summary.categoryPath = normalizedCategory || "";

    const specsList = normalizeSpecsInput(entry?.specifications);
    const normalizedSpecs = {};
    for (const spec of specsList.slice(0, 2)) {
      const label = (spec.key_label ?? spec.key_norm ?? "").toString().trim();
      const value = (spec.value ?? "").toString().trim();
      if (!label || !value) continue;
      const display = spec.unit ? `${value} ${spec.unit}`.trim() : value;
      if (!display) continue;
      normalizedSpecs[label] = display;
    }
    summary.specifications = normalizedSpecs;

    out.push(summary);
  }
  return out;
}

// Helper used by sanitizeItemsSummary (exact semantics)
function normalizeSpecsInput(specsMaybeArray) {
  const arr = Array.isArray(specsMaybeArray) ? specsMaybeArray : [];
  return arr.filter(Boolean);
}

// ---- sanitizeQuotationsCount (exact) ----
export function sanitizeQuotationsCount(value) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

// ---- specRowsToEntries (exact) ----
// Input: rfq_item_specs[] rows
// Output: array of { label, value, display } where display="label: value" or "value" (+unit)
export function specRowsToEntries(specRows = []) {
  const entries = [];
  for (const row of specRows) {
    if (!row) continue;

    const rawValue = row.value ?? "";
    let value =
      typeof rawValue === "string" ? rawValue.trim() : String(rawValue ?? "").trim();
    if (!value) continue;

    const unit = (row.unit ?? "").toString().trim();
    if (unit) value = `${value} ${unit}`;

    const label = (row.key_label ?? row.key_norm ?? "").toString().trim();
    const display = label ? `${label}: ${value}` : value;

    entries.push({ label, value, display });
  }
  return entries;
}

// ---- toSpecEntries (exact) ----
// Pass-through if already has "display"; else derive via specRowsToEntries
export function toSpecEntries(source = []) {
  if (!Array.isArray(source)) return [];
  if (
    source.length &&
    typeof source[0] === "object" &&
    Object.prototype.hasOwnProperty.call(source[0], "display")
  ) {
    return source;
  }
  return specRowsToEntries(source);
}

// ---- buildSpecRecord (exact) ----
// Takes entries (or rows), returns object map of up to 2 specs: { label: value }
export function buildSpecRecord(entries = [], limit = 2) {
  const record = {};
  let count = 0;
  for (const entry of toSpecEntries(entries)) {
    if (count >= limit) break;
    const key = entry.label || `Spec ${count + 1}`;
    const label =
      typeof key === "string" ? key.trim() : String(key ?? "").trim();
    const value =
      typeof entry.value === "string" ? entry.value.trim() : String(entry.value ?? "").trim();
    if (!label || !value) continue;
    record[label] = value;
    count += 1;
  }
  return record;
}

// ---- makeItemPreview (exact) ----
// Prefers: "product_name — firstSpec"; else name; else first spec; else "Qty N"; else purchase_type; else null
export function makeItemPreview(itemRow = {}, specSource = []) {
  const entries = toSpecEntries(specSource);
  const specStrings = entries.map((entry) => entry.display).filter(Boolean);

  const name = (itemRow.product_name ?? "").toString().trim();
  if (name && specStrings.length) return `${name} — ${specStrings[0]}`;
  if (name) return name;

  if (specStrings.length) return specStrings[0];

  const quantity = Number(itemRow.quantity);
  if (Number.isFinite(quantity) && quantity > 0) return `Qty ${quantity}`;

  const purchaseType = (itemRow.purchase_type ?? "").toString().trim();
  if (purchaseType) return purchaseType;

  return null;
}

// ---- buildSummaryEntry (exact) ----
// Output: { name, categoryPath, qty?, specifications: {label:value} }
export function buildSummaryEntry(itemRow = {}, specSource = []) {
  const entries = toSpecEntries(specSource);
  const specDisplays = entries.map((entry) => entry.display).filter(Boolean);

  const productName = (itemRow.product_name ?? "").toString().trim();
  const name = productName || specDisplays[0] || "Item";

  const summary = {
    name,
    categoryPath: (itemRow.category_path ?? itemRow.categoryPath ?? "").toString().trim(),
  };

  const qty = Number(itemRow.quantity);
  if (Number.isFinite(qty) && qty > 0) summary.qty = qty;

  const specsRecord = buildSpecRecord(entries);
  summary.specifications = specsRecord;

  return summary;
}