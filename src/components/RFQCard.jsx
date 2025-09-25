// src/components/RFQCard.jsx
import React from "react";
import { Hash } from "lucide-react";

/**
 * RFQCard
 * Props:
 *  - rfq: object | null
 *  - dense: boolean
 *  - onSendQuote: function(rfq)
 */
export default function RFQCard({ rfq = null, dense = false, onSendQuote = () => {} }) {
  const safeRfq = rfq || {};

  const quotationsCount =
    typeof safeRfq.quotationsCount === "number"
      ? safeRfq.quotationsCount
      : Array.isArray(safeRfq.quotations)
      ? safeRfq.quotations.length
      : typeof safeRfq.quotes_count === "number"
      ? safeRfq.quotes_count
      : 0;

  const rawPreview = Array.isArray(safeRfq.itemsPreview)
    ? safeRfq.itemsPreview
    : Array.isArray(safeRfq.items)
    ? safeRfq.items
    : [];

  const preview = rawPreview
    .slice(0, 3)
    .map((it) =>
      typeof it === "string" ? it : it?.name || it?.title || it?.item_name || String(it || "")
    );

  const previewCount = Array.isArray(rawPreview) ? rawPreview.length : 0;
  const overflowCount = Math.max(0, previewCount - preview.length);

  const sellerIdDisplay = safeRfq.sellerIdDisplay || null;
  const views = Number(safeRfq.views || 0);

  const handleSendQuote = (e) => {
    e?.preventDefault();
    try {
      onSendQuote(safeRfq);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("onSendQuote failed", err);
    }
  };

  const containerClasses = [
    "bg-white border rounded-md flex items-center justify-between",
    dense ? "py-2 px-3" : "py-4 px-5",
  ].join(" ");

  return (
    <article
      className={containerClasses}
      aria-labelledby={`rfq-title-${safeRfq.id ?? (sellerIdDisplay || "unknown")}`}
    >
      <div className="flex-1 min-w-0">
        <h3
          id={`rfq-title-${safeRfq.id ?? (sellerIdDisplay || "unknown")}`}
          className="text-lg font-semibold truncate"
        >
          {safeRfq.title || "—"}
        </h3>

        <div className="mt-2 flex items-center flex-wrap gap-3 text-sm text-slate-600">
          {sellerIdDisplay ? (
            <span
              className="inline-flex items-center gap-1 border rounded px-2 py-1 text-xs bg-slate-50"
              title="RFQ ID"
            >
              <Hash className="w-3.5 h-3.5" />
              {sellerIdDisplay}
            </span>
          ) : null}

          <span className="inline-flex items-center gap-1 text-xs">{views} views</span>
          <span className="inline-flex items-center gap-1 text-xs">
            {quotationsCount} {quotationsCount === 1 ? "quote" : "quotes"}
          </span>
        </div>

        {preview.length > 0 ? (
          <div className="mt-3 text-sm text-slate-700 flex items-center gap-2 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap">
              {preview.map((name, i) => (
                <span
                  key={`item-preview-${i}`}
                  className="inline-block bg-slate-50 border rounded px-2 py-1 text-xs truncate"
                  title={name}
                >
                  {name}
                </span>
              ))}
              {overflowCount > 0 ? (
                <span className="inline-block px-2 py-1 text-xs text-slate-500">
                  +{overflowCount} more
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="ml-4 flex-shrink-0">
        <button
          onClick={handleSendQuote}
          aria-label={`Send quote for ${safeRfq.title || sellerIdDisplay || "RFQ"}`}
          className="px-4 py-2 border rounded-md bg-white hover:bg-slate-50 text-sm"
        >
          Send quote
        </button>
      </div>
    </article>
  );
}