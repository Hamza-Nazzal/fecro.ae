// src/components/RFQCard.jsx
import React from "react";
import { CheckCircle, Clock, XCircle, Eye } from "lucide-react";
import { normalizeSpecsInput } from "../utils/rfqSpecs";

// REGIONS:
// [SHARED]: used by both buyer and seller cards.
// [SELLER ONLY]: rendered only for seller audience; will move to SellerRFQCard.jsx.
// [BUYER ONLY]: rendered only for buyer audience; will move to BuyerRFQCard.jsx.

/**
 * TEMP (2025-09-25): hide "views" & "quotes" on seller RFQ cards pending product decision.
 * Data is still available on the rfq object (quotationsCount, views) if we re-enable later.
 */
const SHOW_QUOTE_AND_VIEW_BADGES = false;

// TEMP DEBUG (remove after verification)
const DEBUG_ITEMS = true;

/**
 * RFQCard
 * Minimal deps, no external CSS. Accepts:
 *  - rfq: object with fields like { id, title, sellerRfqId, status, categoryPath, itemsSummary?, itemsPreview?, views?, quotationsCount? }
 *  - dense: boolean (tight padding)
 *  - audience: "buyer" | "seller" (default "buyer")
 *  - onSendQuote: (rfq) => void
 */
export default function RFQCard({ rfq = null, dense = false, audience = "buyer", onSendQuote = () => {} }) {
  const safeRfq = rfq || {};

  // [SHARED] START
  // ---- status badge ----
  const getStatusConfig = (status) => {
    const s = String(status || "").toLowerCase();
    switch (s) {
      case "active":
        return { icon: CheckCircle, label: "Active", className: "text-green-600 bg-green-50 border-green-200" };
      case "pending":
        return { icon: Clock, label: "Pending", className: "text-amber-600 bg-amber-50 border-amber-200" };
      case "closed":
        return { icon: XCircle, label: "Closed", className: "text-gray-600 bg-gray-50 border-gray-200" };
      default:
        return { icon: Clock, label: "Pending", className: "text-amber-600 bg-amber-50 border-amber-200" };
    }
  };
  const statusCfg = getStatusConfig(safeRfq.status);
  const StatusIcon = statusCfg.icon;
  // [SHARED] END


  // ---- ID / metrics ----
  const sellerRfqId = safeRfq.sellerRfqId || null;
  const publicId = safeRfq.publicId || safeRfq.public_id || null;
  const isSeller = audience === "seller";
  
  // [SELLER ONLY] START
  const sellerHeaderIdText = sellerRfqId || publicId || safeRfq.title || "—";
  // [SELLER ONLY] END
  
  // [BUYER ONLY] START
  const buyerHeaderIdText = publicId || safeRfq.title || "—";
  // [BUYER ONLY] END
  
  const headerIdText = isSeller ? sellerHeaderIdText : buyerHeaderIdText;

  // [SHARED] START
  const views = Number(safeRfq.views || 0);
  const quotationsCount =
    typeof safeRfq.quotationsCount === "number"
      ? safeRfq.quotationsCount
      : Array.isArray(safeRfq.quotations)
      ? safeRfq.quotations.length
      : typeof safeRfq.quotes_count === "number"
      ? safeRfq.quotes_count
      : 0;

  // ---- items: prefer structured summary, fallback to old preview chips ----
  const itemsSummary = Array.isArray(safeRfq.itemsSummary) ? safeRfq.itemsSummary : null;
  const itemsPreview = Array.isArray(safeRfq.itemsPreview) ? safeRfq.itemsPreview : [];

  const maxItems = 2; // show up to 2 items per card
  const shownSummary = itemsSummary ? itemsSummary.slice(0, maxItems) : [];
  const shownPreview = !itemsSummary ? itemsPreview.slice(0, maxItems) : [];
  const totalItems = itemsSummary ? itemsSummary.length : itemsPreview.length;
  const overflowCount =
    Math.max(0, totalItems - (itemsSummary ? shownSummary.length : shownPreview.length));
  // [SHARED] END

  // [SHARED] START
  const handleSendQuote = (e) => {
    e?.preventDefault();
    try {
      onSendQuote(safeRfq);
    } catch {
      /* no-op */
    }
  };

  const containerClasses = [
    "bg-white border rounded-md flex items-center justify-between",
    dense ? "py-2 px-3" : "py-4 px-5",
  ].join(" ");
  // [SHARED] END

  return (
    <div
      className={containerClasses}
      role="article"
      aria-labelledby={`rfq-title-${safeRfq.id ?? (headerIdText || "unknown")}`}
    >
      <div className="flex-1 min-w-0">
        {/* Header: SRF ID + status */}
        <div className="flex items-start justify-between gap-3">
          <h3
            id={`rfq-title-${safeRfq.id ?? (headerIdText || "unknown")}`}
            className="text-sm font-semibold truncate flex-1"
            title={safeRfq.title || ""}
          >
            {headerIdText}
          </h3>

          {/* [SHARED] START */}
          <div
            className={`inline-flex items-center gap-1 border rounded-full px-2 py-1 text-xs ${statusCfg.className}`}
            aria-label={`Status: ${statusCfg.label}`}
          >
            <StatusIcon className="w-3 h-3" />
            <span>{statusCfg.label}</span>
          </div>
          {/* [SHARED] END */}
        </div>

        {/* Stats row */}
        <div className="mt-2 flex items-center flex-wrap gap-3 text-sm text-slate-600">
          {/* [SELLER ONLY] START */}
          {/* SRF chip - only show for sellers */}
          {isSeller && sellerRfqId && (
            <span className="inline-block bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs text-blue-700">
              {sellerRfqId}
            </span>
          )}
          {/* [SELLER ONLY] END */}
          
          {/* [SHARED] START */}
          {/* HIDDEN (toggle later if needed) */}
          {SHOW_QUOTE_AND_VIEW_BADGES && (
            <span className="inline-flex items-center gap-1 text-xs">
              <Eye className="w-3.5 h-3.5" />
              {views} views
            </span>
          )}
          {SHOW_QUOTE_AND_VIEW_BADGES && (
            <span className="inline-flex items-center gap-1 text-xs">
              {quotationsCount} {quotationsCount === 1 ? "quote" : "quotes"}
            </span>
          )}
          {/* [SHARED] END */}
        </div>

        {/* [SHARED] START */}
        {/* Items: structured summary (preferred) or legacy chips (fallback) */}
        {itemsSummary ? (
          shownSummary.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {//DEBUG_ITEMS && (
                // eslint-disable-next-line no-console
               // console.log('RFQCard DEBUG itemsSummary len:', Array.isArray(itemsSummary) ? itemsSummary.length : 0,
                 //           'sample:', Array.isArray(itemsSummary) ? itemsSummary[0] : null,
                   //         'rfq.id:', safeRfq?.id, 'sellerRfqId:', safeRfq?.sellerRfqId)
              //)
              }
              {shownSummary.map((it, i) => {
                if (DEBUG_ITEMS && i === 0) {
                  // eslint-disable-next-line no-console
                 // console.log('RFQCard DEBUG first itemSummary entry:', it);
                }

                const name =
                  it?.name || it?.title || it?.item_name || (typeof it === "string" ? it : "");
                const qty =
                  typeof it?.qty === "number"
                    ? it.qty
                    : typeof it?.quantity === "number"
                    ? it.quantity
                    : null;

                // Category tail fallback (same logic as SellerQuoteComposer)
                const itemCat = it?.categoryPath || it?.category_path;
                const rfqCat = safeRfq.categoryPath || safeRfq.first_category_path || "";
                const catPath = itemCat || rfqCat; // fallback to RFQ-level path
                const categoryTail = catPath ? catPath.split(" > ").pop() : "";

                // Specs formatting (limit to first 10 entries)
                const specsList = normalizeSpecsInput(it?.specifications);
                const specsText = specsList
                  .slice(0, 10)
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
                  <div key={`item-sum-${i}`} className="text-slate-700 pl-3 border-l-2 border-slate-200">
                    {/* Line 1: bullet dot + item name — category tail */}
                    <div className="text-base font-medium">
                      • {name}
                      {categoryTail && <span className="text-slate-500"> — {categoryTail}</span>}
                    </div>

                    {/* Line 2: Qty (if present and > 0) */}
                    {Number.isFinite(qty) && qty > 0 && (
                      <div className="text-xs text-slate-600 mt-1">
                        Qty: {qty}
                      </div>
                    )}

                    {/* Line 3: Specs (up to 2 pairs) */}
                    {!!specsText && (
                      <div className="text-xs text-slate-600 mt-1">Specs: {specsText}</div>
                    )}
                  </div>
                );
              })}

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
            </div>
          )
        )}
        {/* [SHARED] END */}
      </div>

      {/* [SELLER ONLY] START */}
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={handleSendQuote}
          aria-label={`Send quote for ${safeRfq.title || headerIdText || "RFQ"}`}
          className="px-4 py-2 border rounded-md bg-white hover:bg-slate-50 text-sm transition-colors"
        >
          Send quote
        </button>
      </div>
      {/* [SELLER ONLY] END */}
    </div>
  );
}
