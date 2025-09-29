// src/services/rfqService/reads.js
import { supabase } from "../backends/supabase";
import { normalizeSpecsInput } from "../../utils/rfq/rfqSpecs";

import {
  sanitizeItemsPreview,
  sanitizeItemsSummary,
  sanitizeQuotationsCount,
  getSellerRfqId,
  specRowsToEntries,
  toSpecEntries,
  buildSpecRecord,
  makeItemPreview,
  buildSummaryEntry,
} from '../../utils/rfq/sanitizers';


// Coalesce identical concurrent calls by params signature
const __inflight = new Map(); // key -> Promise
function __keyFor(params) {
  try { return JSON.stringify(params || {}); } catch { return 'default'; }
}

function getSellerRfqId(row) {
  return row?.seller_rfq_id || null;
}

function isMissingRelationError(error, relationName) {
  const msg = String(error?.message || "").toLowerCase();
  if (!relationName) return false;
  const rel = relationName.toLowerCase();
  return (
    (msg.includes("does not exist") || msg.includes("unknown table") || msg.includes("undefined table")) &&
    msg.includes(rel)
  );
}

function sanitizeItemsPreview(values) {
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

function sanitizeItemsSummary(entries, fallbackCategoryPath = "") {
  if (!Array.isArray(entries)) return [];
  const out = [];
  const fallback = typeof fallbackCategoryPath === "string"
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
    const category = typeof categoryRaw === "string" ? categoryRaw.trim() : String(categoryRaw ?? "").trim();
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

function sanitizeQuotationsCount(value) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function specRowsToEntries(specRows = []) {
  const entries = [];
  for (const row of specRows) {
    if (!row) continue;
    const rawValue = row.value ?? "";
    let value = typeof rawValue === "string" ? rawValue.trim() : String(rawValue ?? "").trim();
    if (!value) continue;
    const unit = (row.unit ?? "").toString().trim();
    if (unit) value = `${value} ${unit}`;
    const label = (row.key_label ?? row.key_norm ?? "").toString().trim();
    const display = label ? `${label}: ${value}` : value;
    entries.push({ label, value, display });
  }
  return entries;
}

function toSpecEntries(source = []) {
  if (!Array.isArray(source)) return [];
  if (source.length && typeof source[0] === "object" && Object.prototype.hasOwnProperty.call(source[0], "display")) {
    return source;
  }
  return specRowsToEntries(source);
}

function buildSpecRecord(entries = [], limit = 2) {
  const record = {};
  let count = 0;
  for (const entry of toSpecEntries(entries)) {
    if (count >= limit) break;
    const key = entry.label || `Spec ${count + 1}`;
    const label = typeof key === "string" ? key.trim() : String(key ?? "").trim();
    const value = typeof entry.value === "string" ? entry.value.trim() : String(entry.value ?? "").trim();
    if (!label || !value) continue;
    record[label] = value;
    count += 1;
  }
  return record;
}

function makeItemPreview(itemRow = {}, specSource = []) {
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

function buildSummaryEntry(itemRow = {}, specSource = []) {
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

async function fetchQuotationCounts(rfqIds = []) {
  if (!Array.isArray(rfqIds) || rfqIds.length === 0) return new Map();
  const uniqueIds = [...new Set(rfqIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map();
  const { data, error } = await supabase
    .from("quotations")
    .select("rfq_id")
    .in("rfq_id", uniqueIds);
  if (error) {
    if (isMissingRelationError(error, "quotations")) return new Map();
    throw new Error(error.message);
  }
  const counts = new Map();
  for (const row of data || []) {
    const id = row?.rfq_id;
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

async function fetchItemsPreviewData(rfqIds = []) {
  const key = __keyFor(rfqIds);
  if (__inflight.has(key)) return __inflight.get(key);
  const task = (async () => {
    // --- existing implementation START (unchanged) ---
    if (!Array.isArray(rfqIds) || rfqIds.length === 0) {
      return { previewMap: new Map(), summaryMap: new Map() };
    }
    const uniqueIds = [...new Set(rfqIds.filter(Boolean))];
    if (!uniqueIds.length) return { previewMap: new Map(), summaryMap: new Map() };

    const { data: items, error: itemsError } = await supabase
      .from("rfq_items")
      .select("id, rfq_id, product_name, quantity, purchase_type, category_path")
      .in("rfq_id", uniqueIds)
      .order("created_at", { ascending: true });
    if (itemsError) {
      if (isMissingRelationError(itemsError, "rfq_items")) {
        return { previewMap: new Map(), summaryMap: new Map() };
      }
      throw new Error(itemsError.message);
    }

    const itemRows = items || [];
    const itemIds = itemRows.map((it) => it?.id).filter(Boolean);
    const specsByItem = new Map();

    if (itemIds.length) {
      const { data: specs, error: specsError } = await supabase
        .from("rfq_item_specs")
        .select("rfq_item_id, key_label, key_norm, value, unit")
        .in("rfq_item_id", itemIds);
      if (specsError) {
        if (!isMissingRelationError(specsError, "rfq_item_specs")) {
          throw new Error(specsError.message);
        }
      } else {
        for (const spec of specs || []) {
          if (!spec) continue;
          const list = specsByItem.get(spec.rfq_item_id) || [];
          list.push(spec);
          specsByItem.set(spec.rfq_item_id, list);
        }
      }
    }

    const previewMap = new Map();
    const summaryMap = new Map();

    for (const item of itemRows) {
      if (!item?.rfq_id) continue;
      const rfqId = item.rfq_id;
      const specRows = specsByItem.get(item.id) || [];
      const specEntries = toSpecEntries(specRows);

      const preview = makeItemPreview(item, specEntries);
      if (preview) {
        const previews = previewMap.get(rfqId) || [];
        if (!previews.includes(preview)) previews.push(preview);
        previewMap.set(rfqId, previews);
      }

      const summaryEntry = buildSummaryEntry(item, specEntries);
      if (summaryEntry) {
        const summary = summaryMap.get(rfqId) || [];
        if (summary.length < 5) {
          summary.push(summaryEntry);
          summaryMap.set(rfqId, summary);
        }
      }
    }

    return { previewMap, summaryMap };
    // --- existing implementation END ---
  })();
  __inflight.set(key, task);
  try {
    return await task;
  } finally {
    __inflight.delete(key);
  }
}

async function enrichRfqCardRows(rows = []) {
  const key = __keyFor(rows);
  if (__inflight.has(key)) return __inflight.get(key);
  const task = (async () => {
    // --- existing implementation START (unchanged) ---
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const rfqIds = rows.map((row) => row?.id).filter(Boolean);
    const needsQuotes = rows.some((row) => typeof row?.quotations_count !== "number");
    const existingPreview = (row) => {
      if (Array.isArray(row?.items_preview)) return row.items_preview;
      if (Array.isArray(row?.itemsPreview)) return row.itemsPreview;
      return null;
    };
    const existingSummary = (row) => {
      if (Array.isArray(row?.items_summary)) return row.items_summary;
      if (Array.isArray(row?.itemsSummary)) return row.itemsSummary;
      return null;
    };

    const needsPreview = rows.some((row) => {
      const arr = existingPreview(row);
      return !Array.isArray(arr) || arr.length === 0;
    });

    const hasNonEmptySpecs = (summary) =>
      summary && typeof summary.specifications === "object" && Object.keys(summary.specifications || {}).length > 0;

    const summaryNeedsFetchFlags = rows.map((row) => {
      const arr = existingSummary(row);
      if (!Array.isArray(arr) || arr.length === 0) return true;
      return arr.some((s) => !hasNonEmptySpecs(s));
    });

    const needsSummary = summaryNeedsFetchFlags.some(Boolean);

    const [quotesMap, itemsData] = await Promise.all([
      needsQuotes ? fetchQuotationCounts(rfqIds) : Promise.resolve(new Map()),
      needsPreview || needsSummary
        ? fetchItemsPreviewData(rfqIds)
        : Promise.resolve({ previewMap: new Map(), summaryMap: new Map() }),
    ]);

    const previewMap = itemsData?.previewMap instanceof Map ? itemsData.previewMap : new Map();
    const summaryMap = itemsData?.summaryMap instanceof Map ? itemsData.summaryMap : new Map();

    return rows.map((row, index) => {
      const next = { ...row };
      const id = row?.id;

      const quotesValue =
        typeof row?.quotations_count === "number"
          ? row.quotations_count
          : typeof row?.quotes_count === "number"
          ? row.quotes_count
          : id && quotesMap.has(id)
          ? quotesMap.get(id)
          : row?.quotationsCount;
      next.quotations_count = sanitizeQuotationsCount(quotesValue);

      const previewCandidate = existingPreview(row);
      const previewSource = Array.isArray(previewCandidate) && previewCandidate.length
        ? previewCandidate
        : id && previewMap.has(id)
        ? previewMap.get(id)
        : [];
      next.items_preview = sanitizeItemsPreview(previewSource);

      const summaryCandidate = existingSummary(row);
      const summaryNeeds = summaryNeedsFetchFlags[index];
      const summarySource = (() => {
        if (!summaryNeeds) return summaryCandidate;

        const fetched = (id && summaryMap.has(id) ? summaryMap.get(id) : []) || [];

        if (Array.isArray(summaryCandidate) && summaryCandidate.length) {
          const merged = summaryCandidate.map((entry, entryIndex) => {
            if (hasNonEmptySpecs(entry)) return entry;
            const fetchedEntry = fetched[entryIndex];
            if (hasNonEmptySpecs(fetchedEntry)) {
              return { ...entry, specifications: fetchedEntry.specifications };
            }
            const baseSpecs = entry?.specifications;
            return {
              ...entry,
              specifications: baseSpecs && typeof baseSpecs === "object" ? baseSpecs : {},
            };
          });

          if (fetched.length > merged.length) {
            const extras = fetched.slice(merged.length).filter(Boolean);
            return merged.concat(extras);
          }

          return merged;
        }

        return fetched;
      })();
      const fallbackCategoryPath = (() => {
        const candidate =
          row?.first_category_path ??
          row?.category_path ??
          row?.categoryPath ??
          row?.category ??
          row?.categories?.path_text ??
          "";
        return typeof candidate === "string" ? candidate : String(candidate ?? "");
      })();
      next.items_summary = sanitizeItemsSummary(summarySource, fallbackCategoryPath);

      return next;
    });
    // --- existing implementation END ---
  })();
  __inflight.set(key, task);
  try {
    return await task;
  } finally {
    __inflight.delete(key);
  }
}

// Map DB row → UI shape (matches your view columns)
export function rfqCardDbToJs(row) {
  const sellerRfqId = getSellerRfqId(row);
  
  return {
    id: row?.id,
    publicId: row?.public_id ?? row?.id,
    sellerRfqId: sellerRfqId,
    title: row?.title ?? "Untitled RFQ",
    status: row?.status ?? "active",               // your data uses 'active'
    postedAt: row?.created_at ?? null,
    deadline: null,                                 // not in your view
    buyerId: row?.buyer_id ?? null,
    buyer: row?.buyer_id ? { id: row.buyer_id } : null,
    views: 0,                                       // not in your view
    quotationsCount: sanitizeQuotationsCount(
      typeof row?.quotations_count === "number"
        ? row.quotations_count
        : typeof row?.quotes_count === "number"
        ? row.quotes_count
        : row?.quotationsCount
    ),
    items: [],                                      // not in your view
    itemsPreview: sanitizeItemsPreview(
      Array.isArray(row?.items_preview) ? row.items_preview : row?.itemsPreview
    ),
    itemsSummary: sanitizeItemsSummary(
      Array.isArray(row?.items_summary) ? row.items_summary : row?.itemsSummary,
      row?.first_category_path ??
        row?.category_path ??
        row?.categoryPath ??
        row?.category ??
        row?.categories?.path_text ??
        ""
    ),
    categoryPath: row?.first_category_path ?? "",
    notes: null,
    qtyTotal: row?.qty_total ?? null,
  };
}

export async function listRFQsForCards({
  page = 1,
  pageSize = 20,
  onlyOpen,
  rfqId,
  buyerId,
  search,
  sort,
} = {}) {
  const key = __keyFor({ page, pageSize, onlyOpen, rfqId, buyerId, search, sort });
  if (__inflight.has(key)) return __inflight.get(key);
  const task = (async () => {
    // --- existing implementation START (unchanged) ---
    let q = supabase.from("v_rfqs_card").select("*");

    if (rfqId) q = q.or(`id.eq.${rfqId},public_id.eq.${rfqId}`);
    if (buyerId) q = q.eq("buyer_id", buyerId);

    if (onlyOpen) q = q.eq("status", "active");

    if (search && search.trim()) {
      const s = search.trim();
      q = q.or(
        [
          `title.ilike.%${s}%`,
          `public_id.ilike.%${s}%`,
          `first_category_path.ilike.%${s}%`,
        ].join(",")
      );
    }

    switch (sort) {
      case "posted_asc":
        q = q.order("created_at", { ascending: true });
        break;
      case "deadline_asc":
        q = q.order("created_at", { ascending: true });
        break;
      case "views_desc":
        q = q.order("created_at", { ascending: false });
        break;
      case "posted_desc":
      default:
        q = q.order("created_at", { ascending: false });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    q = q.range(from, to);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const enriched = await enrichRfqCardRows(data || []);
    return enriched.map(rfqCardDbToJs);
    // --- existing implementation END ---
  })();
  __inflight.set(key, task);
  try {
    return await task;
  } finally {
    __inflight.delete(key);
  }
}

export async function getRFQById(rfqId) {
  if (!rfqId) throw new Error("rfqId is required");
  const { data, error } = await supabase
    .from("v_rfqs_card")
    .select("*")
    .or(`id.eq.${rfqId},public_id.eq.${rfqId}`)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [enriched] = await enrichRfqCardRows([data]);
  return rfqCardDbToJs(enriched || data);
}

export async function getRFQ(rfqId) {
  return getRFQById(rfqId);
}

export async function listRFQs(params = {}) {
  return listRFQsForCards(params);
}

export async function listMyRFQs(a, b) {
  if (typeof a === "string" || typeof a === "number") {
    return listRFQsForCards({ ...(b || {}), buyerId: a });
  }
  if (a && typeof a === "object") {
    const { buyerId, userId, ...rest } = a;
    return listRFQsForCards({ buyerId: buyerId ?? userId, ...rest });
  }
  return listRFQsForCards({});
}
