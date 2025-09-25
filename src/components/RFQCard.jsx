// src/components/RFQCard.jsx
import React from "react";
import { Hash, Eye, MessageCircle } from "lucide-react"; // used as icons in Chip
import Chip from "./Chip"; // existing local Chip component
import Button from "./Button"; // if you have a Button component; otherwise adjust to <button>
import classNames from "classnames";

/**
 * RFQCard
 * Props:
 *  - rfq: object | null
 *  - dense: boolean
 *  - onSendQuote: function(rfq)
 */
export default function RFQCard({ rfq = null, dense = false, onSendQuote = () => {} }) {
  // safety: if rfq is null/undefined, provide safe defaults (prevents no-undef and runtime crashes)
  const safeRfq = rfq || {};

  // quotationsCount: prefer explicit numeric value, fall back to arrays or 0
  const quotationsCount =
    typeof safeRfq.quotationsCount === "number"
      ? safeRfq.quotationsCount
      : Array.isArray(safeRfq.quotations)
      ? safeRfq.quotations.length
      : typeof safeRfq.quotes_count === "number"
      ? safeRfq.quotes_count
      : 0;

  // itemsPreview: prefer itemsPreview, fall back to items, or [].
  // Normalise to array of simple strings (name or title).
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

  // event handler for send quote
  const handleSendQuote = (e) => {
    e?.preventDefault();
    if (!safeRfq) return;
    try {
      onSendQuote(safeRfq);
    } catch (err) {
      // swallow errors to avoid breaking UI — caller should handle navigation
      // eslint-disable-next-line no-console
      console.error("onSendQuote failed", err);
    }
  };

  return (
    <article
      className={classNames(
        "rfq-card",
        "bg-white border rounded-md p-4 flex items-center justify-between",
        dense ? "py-2 px-3" : "py-4 px-5"
      )}
      aria-labelledby={`rfq-title-${safeRfq.id ?? (safeRfq.sellerIdDisplay || "unknown")}`}
    >
      <div className="rfq-card__body flex-1 min-w-0">
        <h3
          id={`rfq-title-${safeRfq.id ?? (safeRfq.sellerIdDisplay || "unknown")}`}
          className="text-lg font-semibold truncate"
        >
          {safeRfq.title || "—"}
        </h3>

        <div className="mt-2 flex items-center flex-wrap gap-3 text-sm text-slate-600">
          {sellerIdDisplay ? (
            <Chip icon={Hash} title="RFQ ID">
              {sellerIdDisplay}
            </Chip>
          ) : null}

          <span className="inline-flex items-center gap-2">
            <Chip icon={Eye} title="Views">{`${safeRfq.views ?? 0} views`}</Chip>
          </span>

          <span className="inline-flex items-center gap-2">
            <Chip icon={MessageCircle} title="Quotes">
              {`${quotationsCount} ${quotationsCount === 1 ? "quote" : "quotes"}`}
            </Chip>
          </span>
        </div>

        {/* Items preview row */}
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
                <span className="inline-block px-2 py-1 text-xs text-slate-500">+{overflowCount} more</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rfq-card__actions ml-4 flex-shrink-0">
        {/* Using a simple button so it works even if you don't have a Button component */}
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