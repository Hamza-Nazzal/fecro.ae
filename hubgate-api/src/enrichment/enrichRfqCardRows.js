// hubgate-api/src/enrichment/enrichRfqCardRows.js
// Worker-compatible version of enrichment logic

import { supaGETService } from "../lib/supabase.js";

// Helper: fetch quotation counts for RFQ IDs
async function fetchQuotationCounts(env, rfqIds = []) {
  if (!Array.isArray(rfqIds) || rfqIds.length === 0) return new Map();
  const uniqueIds = [...new Set(rfqIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  try {
    const path = `quotations?rfq_id=in.(${uniqueIds.join(",")})&select=rfq_id`;
    const { data } = await supaGETService(env, path);
    const counts = new Map();
    for (const row of data || []) {
      const id = row?.rfq_id;
      if (!id) continue;
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    return counts;
  } catch {
    return new Map();
  }
}

// Helper: fetch items preview/summary data
async function fetchItemsPreviewData(env, rfqIds = []) {
  if (!Array.isArray(rfqIds) || rfqIds.length === 0) {
    return { previewMap: new Map(), summaryMap: new Map() };
  }
  const uniqueIds = [...new Set(rfqIds.filter(Boolean))];
  if (!uniqueIds.length) return { previewMap: new Map(), summaryMap: new Map() };

  try {
    // Fetch items
    const itemsPath = `rfq_items?rfq_id=in.(${uniqueIds.join(",")})&select=id,rfq_id,product_name,quantity,category_path&order=created_at.asc`;
    const { data: items } = await supaGETService(env, itemsPath);
    if (!Array.isArray(items)) return { previewMap: new Map(), summaryMap: new Map() };

    const itemIds = items.map((it) => it?.id).filter(Boolean);
    const specsByItem = new Map();

    // Fetch specs if items exist
    if (itemIds.length) {
      try {
        const specsPath = `rfq_item_specs?rfq_item_id=in.(${itemIds.join(",")})&select=rfq_item_id,key_label,key_norm,value,unit`;
        const { data: specs } = await supaGETService(env, specsPath);
        if (Array.isArray(specs)) {
          for (const spec of specs) {
            if (!spec) continue;
            const list = specsByItem.get(spec.rfq_item_id) || [];
            list.push(spec);
            specsByItem.set(spec.rfq_item_id, list);
          }
        }
      } catch {
        // Non-fatal
      }
    }

    // Build preview and summary maps
    const previewMap = new Map();
    const summaryMap = new Map();

    for (const item of items) {
      if (!item?.rfq_id) continue;
      const rfqId = item.rfq_id;
      const specRows = specsByItem.get(item.id) || [];

      // Simple preview: product name
      const preview = item.product_name?.trim();
      if (preview) {
        const previews = previewMap.get(rfqId) || [];
        if (!previews.includes(preview)) previews.push(preview);
        previewMap.set(rfqId, previews);
      }

      // Simple summary entry
      const summaryEntry = {
        name: item.product_name?.trim() || "Item",
        qty: Number(item.quantity) || null,
        categoryPath: item.category_path?.trim() || "",
        specifications: {},
      };
      
      // Add first 2 specs
      for (const spec of specRows.slice(0, 2)) {
        const label = (spec.key_label || spec.key_norm || "").trim();
        const value = (spec.value || "").toString().trim();
        if (label && value) {
          const display = spec.unit ? `${value} ${spec.unit}`.trim() : value;
          summaryEntry.specifications[label] = display;
        }
      }

      const summary = summaryMap.get(rfqId) || [];
      if (summary.length < 5) {
        summary.push(summaryEntry);
        summaryMap.set(rfqId, summary);
      }
    }

    return { previewMap, summaryMap };
  } catch {
    return { previewMap: new Map(), summaryMap: new Map() };
  }
}

// Main enrichment function
export async function enrichRfqCardRows(env, rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const rfqIds = rows.map((row) => row?.id).filter(Boolean);
  
  // Check what's missing
  const needsQuotes = rows.some((row) => typeof row?.quotations_count !== "number");
  const needsPreview = rows.some((row) => {
    const arr = Array.isArray(row?.items_preview) ? row.items_preview : [];
    return arr.length === 0;
  });
  const needsSummary = rows.some((row) => {
    const arr = Array.isArray(row?.items_summary) ? row.items_summary : [];
    return arr.length === 0;
  });

  // Fetch in parallel
  const [quotesMap, itemsData] = await Promise.all([
    needsQuotes ? fetchQuotationCounts(env, rfqIds) : Promise.resolve(new Map()),
    needsPreview || needsSummary
      ? fetchItemsPreviewData(env, rfqIds)
      : Promise.resolve({ previewMap: new Map(), summaryMap: new Map() }),
  ]);

  const previewMap = itemsData?.previewMap instanceof Map ? itemsData.previewMap : new Map();
  const summaryMap = itemsData?.summaryMap instanceof Map ? itemsData.summaryMap : new Map();

  // Enrich each row
  return rows.map((row) => {
    const next = { ...row };
    const id = row?.id;

    // Add quotations_count if missing
    if (typeof next.quotations_count !== "number" && id && quotesMap.has(id)) {
      next.quotations_count = quotesMap.get(id);
    }

    // Add items_preview if missing
    if (!Array.isArray(next.items_preview) || next.items_preview.length === 0) {
      next.items_preview = id && previewMap.has(id) ? previewMap.get(id) : [];
    }

    // Add items_summary if missing
    if (!Array.isArray(next.items_summary) || next.items_summary.length === 0) {
      const fallbackCategoryPath =
        row?.first_category_path ?? row?.category_path ?? "";
      const fetched = id && summaryMap.has(id) ? summaryMap.get(id) : [];
      
      // Ensure each entry has categoryPath
      const enriched = fetched.map((entry) => ({
        ...entry,
        categoryPath: entry.categoryPath || fallbackCategoryPath,
      }));
      
      next.items_summary = enriched;
    }

    return next;
  });
}

