// src/components/RFQCard.jsx
import React from "react";
import { CheckCircle, Clock, XCircle, Eye } from "lucide-react";
import RFQCardItems from "./RFQCardItems";

// REGIONS:
// [SHARED]: used by both buyer and seller cards.
// [SELLER ONLY]: rendered only for seller audience; will move to SellerRFQCard.jsx.
// [BUYER ONLY]: rendered only for buyer audience; will move to BuyerRFQCard.jsx.

/**
 * TEMP (2025-09-25): hide "views" & "quotes" on seller RFQ cards pending product decision.
 * Data is still available on the rfq object (quotationsCount, views) if we re-enable later.
 */
const SHOW_QUOTE_AND_VIEW_BADGES = false;

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
  const itemsSummary = (Array.isArray(safeRfq.itemsSummary) && safeRfq.itemsSummary.length > 0) ? safeRfq.itemsSummary : null;
  const itemsPreview = Array.isArray(safeRfq.itemsPreview) ? safeRfq.itemsPreview : [];
  const maxItems = 5; // show up to 5 items per card
  // [SHARED] END

  // [SHARED] START
  const handleSendQuote = (e) => {
    e?.preventDefault();
    e?.stopPropagation?.();
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
          
          {/* [BUYER ONLY] START */}
          {/* Quotation count for buyers */}
          {!isSeller && (
            <span className="inline-flex items-center gap-1 text-xs font-medium">
              {quotationsCount} {quotationsCount === 1 ? "quotation" : "quotations"} submitted
            </span>
          )}
          {/* [BUYER ONLY] END */}
          
          {/* [SHARED] START */}
          {/* HIDDEN (toggle later if needed) */}
          {SHOW_QUOTE_AND_VIEW_BADGES && (
            <span className="inline-flex items-center gap-1 text-xs">
              <Eye className="w-3.5 h-3.5" />
              {views} views
            </span>
          )}
          {/* [SHARED] END */}
        </div>

        {/* [SHARED] START */}
        <RFQCardItems
          rfq={safeRfq}
          itemsSummary={itemsSummary}
          itemsPreview={itemsPreview}
          maxItems={maxItems}
        />
        {/* [SHARED] END */}
      </div>

      {/* [SELLER ONLY] START */}
      {isSeller && (
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleSendQuote}
            aria-label={`Send quote for ${safeRfq.title || headerIdText || "RFQ"}`}
            className="px-4 py-2 border rounded-md bg-white hover:bg-slate-50 text-sm transition-colors"
          >
            Send quote
          </button>
        </div>
      )}
      {/* [SELLER ONLY] END */}

      {/* [BUYER ONLY] START */}
      {!isSeller && (
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            onClick={quotationsCount > 0 ? handleSendQuote : undefined}
            disabled={quotationsCount === 0}
            aria-label={`View quotations for ${safeRfq.title || headerIdText || "RFQ"}`}
            className={`px-4 py-2 border rounded-md text-sm transition-colors ${
              quotationsCount === 0
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white hover:bg-slate-50 text-slate-900 cursor-pointer"
            }`}
          >
            View quotations
          </button>
        </div>
      )}
      {/* [BUYER ONLY] END */}
    </div>
  );
}
