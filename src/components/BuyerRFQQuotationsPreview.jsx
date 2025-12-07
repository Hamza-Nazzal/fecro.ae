// src/components/BuyerRFQQuotationsPreview.jsx
// This component is used to display the quotations for a given RFQ.
// It is used in the BuyerRFQDetail component.
// It is used to display the quotations for a given RFQ.
// It is used in the BuyerRFQDetail component.

import React from "react";
import { formatCurrency } from "../services/quotationHelpers.js";
import {
  expressInterestInQuotation,
  fetchBuyerInterestForQuotation,
} from "../services/quotationsService";

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function BuyerRFQQuotationsPreview({
  rfq,
  quotations = [],
  onViewQuotation,
}) {
  // State for interest tracking
  const [interestById, setInterestById] = React.useState({});
  const [interestLoadingId, setInterestLoadingId] = React.useState(null);
  const [interestError, setInterestError] = React.useState("");

  // Helper to load interest lazily
  async function ensureInterestLoadedFor(quotation) {
    const id = quotation.id;
    if (!id) return null;
    if (interestById[id]) return interestById[id];

    const rfqId = quotation.rfqId || rfq?.id || quotation.rfq_id || null;

    try {
      const result = await fetchBuyerInterestForQuotation({ rfqId, quotationId: id });
      if (result) {
        setInterestById(prev => ({ ...prev, [id]: result }));
        return result;
      }
      return null;
    } catch (e) {
      setInterestError(e.message || "Failed to load interest");
      return null;
    }
  }

  // Load interest for all quotations on mount and when quotations or rfq?.id change
  React.useEffect(() => {
    if (!quotations || quotations.length === 0) return;
    quotations.forEach(q => {
      ensureInterestLoadedFor(q);
    });
  }, [quotations, rfq?.id]);

  // Listen for quotationInterest:updated events
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    function handleInterestUpdated(event) {
      const { quotationId } = event.detail || {};
      if (!quotationId) return;

      // Check if this quotation is in our list
      const matchingQuotation = quotations.find(q => q.id === quotationId);
      if (matchingQuotation) {
        // Refresh interest for the matching quotation
        ensureInterestLoadedFor(matchingQuotation);
      } else {
        // Refresh all quotations
        quotations.forEach(q => {
          ensureInterestLoadedFor(q);
        });
      }
    }

    window.addEventListener("quotationInterest:updated", handleInterestUpdated);
    return () => {
      window.removeEventListener("quotationInterest:updated", handleInterestUpdated);
    };
  }, [quotations]);

  // Handler for expressing interest from preview row
  async function handleRowExpressInterest(quotation) {
    const id = quotation.id;
    if (!id) return;
    setInterestError("");
    setInterestLoadingId(id);

    const rfqId = quotation.rfqId || rfq?.id || quotation.rfq_id || null;

    try {
      const interestRow = await expressInterestInQuotation({
        rfqId,
        quotationId: id,
      });

      if (interestRow) {
        setInterestById(prev => ({
          ...prev,
          [id]: {
            id: interestRow.id,
            status: interestRow.status,
            rfqId: interestRow.rfq_id || rfqId || null,
            quotationId: interestRow.quotation_id || id,
            createdAt: interestRow.created_at,
            updatedAt: interestRow.updated_at,
          },
        }));
      }
    } catch (e) {
      setInterestError(e.message || "Failed to express interest");
    } finally {
      setInterestLoadingId(null);
    }
  }

  // Extract RFQ data with fallbacks
  const publicId = rfq?.publicId || rfq?.public_id || null;
  const title = rfq?.title || null;
  const status = rfq?.status || null;
  const postedTime =
    rfq?.postedTime || rfq?.posted_time || rfq?.createdAt || rfq?.created_at || null;
  const totalItems =
    typeof rfq?.itemsCount === "number"
      ? rfq.itemsCount
      : typeof rfq?.items_total_count === "number"
      ? rfq.items_total_count
      : typeof rfq?.items_count === "number"
      ? rfq.items_count
      : null;

  // Sort quotations by totalPrice (ascending), treating non-finite prices as +Infinity
  const sortedQuotations = [...quotations].sort((a, b) => {
    const priceA = typeof a?.totalPrice === "number" && Number.isFinite(a.totalPrice) 
      ? a.totalPrice 
      : Infinity;
    const priceB = typeof b?.totalPrice === "number" && Number.isFinite(b.totalPrice) 
      ? b.totalPrice 
      : Infinity;
    return priceA - priceB;
  });

  // Format posted date
  const formattedPostedDate = postedTime ? formatDateTime(postedTime) : null;

  return (
    <div className="space-y-4">
      {/* Header block */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-start justify-between">
          {/* Left side */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500">RFQ</div>
            <div className="font-semibold text-slate-900 mt-0.5">
              {publicId || "—"}
            </div>
            {title && (
              <div className="text-sm text-slate-600 truncate mt-1">{title}</div>
            )}
          </div>

          {/* Right side */}
          <div className="text-xs text-right text-slate-600 ml-4">
            {status && (
              <div className="uppercase text-slate-700 mb-1">{status}</div>
            )}
            {formattedPostedDate && (
              <div className="text-slate-500">Posted {formattedPostedDate}</div>
            )}
            {typeof totalItems === "number" && (
              <div className="text-slate-500 mt-1">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quotations table area */}
      {quotations.length === 0 ? (
        <div className="text-sm text-slate-500">No quotations received yet.</div>
      ) : (
        <div className="space-y-2">
          {/* Error message */}
          {interestError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
              {interestError}
            </div>
          )}

          {/* Header row */}
          <div className="grid grid-cols-[minmax(0,60px)_minmax(0,160px)_minmax(0,160px)_minmax(0,160px)_minmax(0,1fr)_minmax(0,120px)] gap-3 text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            <div>Rank</div>
            <div>Total amount</div>
            <div>Submitted</div>
            <div>Items quoted</div>
            <div>Quoted by</div>
            <div>Interest</div>
          </div>

          {/* Quotation rows */}
          {sortedQuotations.map((quotation, index) => {
            const rank = index + 1;
            const totalPrice = quotation?.totalPrice;
            const currency = quotation?.currency || "AED";
            const submittedAt = quotation?.submittedAt || quotation?.createdAt || null;
            const createdAt = quotation?.createdAt || null;
            const itemsQuoted = quotation?.itemsQuoted;
            const internalReference = quotation?.internalReference;
            const id = quotation?.id;
            const buyerQuoteRef = quotation?.buyerQuoteRef;
            const qInterest = interestById[id];

            // Format total price
            const hasValidPrice =
              typeof totalPrice === "number" && Number.isFinite(totalPrice);
            const formattedPrice = hasValidPrice
              ? formatCurrency(totalPrice, currency)
              : "—";

            // Display reference (prefer buyerQuoteRef, fallback to internalReference, then synthetic)
            const displayRef =
              buyerQuoteRef ||
              internalReference ||
              (id ? "Q-" + id.slice(0, 8).toUpperCase() : "—");

            // Format submission date
            const submissionDate = submittedAt || createdAt;
            const formattedDate = submissionDate
              ? formatDateTime(submissionDate)
              : "—";
            const dateLabel = submittedAt ? "Submitted" : "Created";

            // Items quoted / total
            let itemsQuotedText = "—";
            if (
              typeof itemsQuoted === "number" &&
              typeof totalItems === "number"
            ) {
              itemsQuotedText = `${itemsQuoted} / ${totalItems}`;
            } else if (typeof totalItems === "number") {
              itemsQuotedText = `— / ${totalItems}`;
            }

            return (
              <div
                key={quotation?.id || index}
                className="grid grid-cols-[minmax(0,60px)_minmax(0,160px)_minmax(0,160px)_minmax(0,160px)_minmax(0,1fr)_minmax(0,120px)] gap-3 items-center text-sm text-slate-700 bg-slate-50/60 rounded-md px-2 py-2"
              >
                {/* Rank */}
                <div className="font-semibold text-slate-900">#{rank}</div>

                {/* Total amount */}
                <div>
                  <div>{formattedPrice}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ref: {displayRef}
                  </div>
                </div>

                {/* Submission date */}
                <div className="text-[12px]">
                  {formattedDate !== "—" ? `${dateLabel}: ${formattedDate}` : "—"}
                </div>

                {/* Items quoted */}
                <div className="text-[12px]">{itemsQuotedText}</div>

                {/* Quoted by (action button) */}
                <div className="text-right">
                  <button
                    onClick={() => onViewQuotation && onViewQuotation(quotation)}
                    className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 underline decoration-blue-300"
                  >
                    View details
                  </button>
                </div>

                {/* Interest column */}
                <div className="text-right">
                  {interestLoadingId === id ? (
                    <span className="text-xs text-slate-500">Saving…</span>
                  ) : qInterest?.status === "pending" ? (
                    <span className="inline-block text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-md">
                      Pending seller
                    </span>
                  ) : qInterest?.status === "approved" ? (
                    <span className="inline-block text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md">
                      Unlocked
                    </span>
                  ) : qInterest?.status === "rejected" ? (
                    <span className="text-xs text-slate-500">Declined</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRowExpressInterest(quotation)}
                      className="text-xs px-2 py-1 border rounded-md hover:bg-slate-50"
                    >
                      I'm interested
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

