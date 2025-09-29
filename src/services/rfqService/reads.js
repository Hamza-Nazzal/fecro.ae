// src/services/rfqService/reads.js
import { supabase } from "../backends/supabase";

import {
  sanitizeItemsPreview,
  sanitizeItemsSummary,
  sanitizeQuotationsCount,
  getSellerRfqId,
  toSpecEntries,
  makeItemPreview,
  buildSummaryEntry,
} from '../../utils/rfq/sanitizers';
import { rfqCardDbToJs } from './mapping';



// Coalesce identical concurrent calls by params signature
const __inflight = new Map(); // key -> Promise
function __keyFor(params) {
  try { return JSON.stringify(params || {}); } catch { return 'default'; }
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
