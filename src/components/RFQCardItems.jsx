// src/components/RFQCardItems.jsx
import React from "react";
import { normalizeSpecsInput } from "../utils/rfq/rfqSpecs";

/**
 * RFQCardItems
 * 
 * Renders the items section of an RFQ card, supporting two display modes:
 * 1. Structured summary (preferred): itemsSummary with full details, specs, qty, category
 * 2. Legacy preview (fallback): simple chip-based itemsPreview
 * 
 * Props:
 *  - rfq: full RFQ object (needed for itemsPreviewRich and category fallbacks)
 *  - itemsSummary: Array | null - structured item data with specs
 *  - itemsPreview: Array - legacy preview chips
 *  - maxItems: number - how many items to display (default 5)
 */
export default function RFQCardItems({
  rfq = {},
  itemsSummary = null,
  itemsPreview = [],
  maxItems = 5,
}) {
  const shownSummary = itemsSummary ? itemsSummary.slice(0, maxItems) : [];
  const shownPreview = !itemsSummary ? itemsPreview.slice(0, maxItems) : [];
  const totalItems = itemsSummary ? itemsSummary.length : itemsPreview.length;
  const overflowCount = Math.max(
    0,
    totalItems - (itemsSummary ? shownSummary.length : shownPreview.length)
  );

  // Group items by category
  const groupedSummary = React.useMemo(() => {
    if (!itemsSummary) return [];
    const map = new Map();
    for (const it of shownSummary) {
      const itemCat = it?.categoryPath || it?.category_path;
      const rfqCat = rfq.categoryPath || rfq.first_category_path || "";
      const catPath = itemCat || rfqCat;
      const categoryTail = catPath ? catPath.split(/\s*[>→]\s*/).pop() : "Uncategorized";
      
      if (!map.has(categoryTail)) map.set(categoryTail, []);
      map.get(categoryTail).push(it);
    }
    return Array.from(map.entries());
  }, [itemsSummary, shownSummary, rfq]);

  // DEBUG: Log to see what's happening (remove after verification)
 /* if (totalItems > 0) {
    console.log('RFQCardItems DEBUG:', {
      totalItems,
      shownCount: itemsSummary ? shownSummary.length : shownPreview.length,
      overflowCount,
      hasItemsSummary: !!itemsSummary,
      itemsSummaryLength: itemsSummary?.length,
      itemsPreviewLength: itemsPreview?.length
    });
    
  }
*/
  return (
    <>
      {/* Items: structured summary (preferred) or legacy chips (fallback) */}
      {itemsSummary ? (
        groupedSummary.length > 0 && (
          <div className="mt-3 space-y-4">
            {groupedSummary.map(([categoryName, categoryItems]) => (
              <div key={categoryName}>
                {/* Category header */}
                <div className="bg-gray-50 border-l-4 border-blue-600 px-3 py-2 mb-2">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    {categoryName}
                  </h3>
                </div>

                {/* Items in this category */}
                <div className="space-y-1.5">
                  {categoryItems.map((it, i) => {
                    const name =
                      it?.name || it?.title || it?.item_name || (typeof it === "string" ? it : "");
                    const qty =
                      typeof it?.qty === "number"
                        ? it.qty
                        : typeof it?.quantity === "number"
                        ? it.quantity
                        : null;

                    // Specs formatting (limit to first two entries)
                    const specsList = normalizeSpecsInput(it?.specifications);
                    const specsText = specsList
                      .slice(0, 2)
                      .map((spec) => {
                        const label = (spec.key_label || spec.key_norm || "").trim();
                        const value = (spec.value ?? "").toString().trim();
                        const unit = (spec.unit ?? "").toString().trim();
                        if (!label || !value) return null;
                        const display = unit ? `${value} ${unit}`.trim() : value;
                        return display ? `${label}=${display}` : null;
                      })
                      .filter(Boolean)
                      .join(" | ");

                    return (
                      <div key={`item-sum-${categoryName}-${i}`} className="text-slate-700 pl-3 border-l-2 border-blue-500">
                        {/* Line 1: bullet dot + item name + quantity pill */}
                        <div className="text-base font-medium flex items-center gap-2">
                          <span>• {name}</span>
                          {Number.isFinite(qty) && qty > 0 && (
                            <span className="inline-block bg-green-100 text-green-700 rounded-full px-3 py-0.5 text-xs font-medium">
                              Qty: {qty}
                            </span>
                          )}
                        </div>

                        {/* Line 3: Specs (up to 2 pairs) */}
                        {!!specsText && (
                          <div className="text-xs text-slate-600 mt-1">Specs: {specsText}</div>
                        )}
                        
                        {/* Spec pills (fallback from structured summary) */}
                        {(() => {
                          const specList = normalizeSpecsInput(it?.specifications)
                            .slice(0, 3)
                            .map((s) => {
                              const label = (s.key_label || s.key_norm || "").trim();
                              const value = (s.value ?? "").toString().trim();
                              const unit  = (s.unit ?? "").toString().trim();
                              if (!label || !value) return null;
                              const display = unit ? `${value} ${unit}` : value;
                              return display ? `${label}: ${display}` : null;
                            })
                            .filter(Boolean);

                          return specList.length ? (
                            <div className="mt-1 flex items-center gap-2 flex-wrap pl-3">
                              {specList.map((pill, pIdx) => (
                                <span
                                  key={`sum-fb-pill-${categoryName}-${i}-${pIdx}`}
                                  className="inline-block bg-slate-50 border rounded px-2 py-0.5 text-xs"
                                  title={pill}
                                >
                                  {pill}
                                </span>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {overflowCount > 0 && (
              <div className="text-xs text-slate-500 italic">+{overflowCount} more items</div>
            )}
          </div>
        )
      ) : (
        shownPreview.length > 0 && (
          <div className="mt-3 text-sm text-slate-700">
            <div className="flex items-center gap-2 flex-wrap">
              {shownPreview.map((val, i) => {
                const label =
                  typeof val === "string"
                    ? val
                    : val?.name || val?.title || val?.item_name || String(val || "");
                return (
                  <span
                    key={`item-preview-${i}`}
                    className="inline-block bg-slate-50 border rounded px-2 py-1 text-xs truncate max-w-[200px]"
                    title={label}
                  >
                    {label}
                  </span>
                );
              })}
              {overflowCount > 0 && (
                <span className="inline-block px-2 py-1 text-xs text-slate-500 bg-slate-100 border rounded">
                  +{overflowCount} more
                </span>
              )}
            </div>
            {/* Preview rich spec pills */}
            {Array.isArray(rfq.itemsPreviewRich) && (
              <div className="mt-2 space-y-1">
                {shownPreview.map((_, idx) => {
                  const rich = rfq.itemsPreviewRich[idx];
                  if (!rich || !Array.isArray(rich.specsPreview) || rich.specsPreview.length === 0) {
                    return null;
                  }
                  return (
                    <div
                      key={`item-rich-${idx}`}
                      className="flex items-center gap-2 flex-wrap pl-3"
                    >
                      {rich.specsPreview.slice(0, 3).map((pill, pIdx) => (
                        <span
                          key={`pill-${idx}-${pIdx}`}
                          className="inline-block bg-slate-50 border rounded px-2 py-0.5 text-xs"
                          title={pill}
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}
    </>
  );
}

