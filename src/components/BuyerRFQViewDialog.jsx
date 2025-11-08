// src/components/BuyerRFQViewDialog.jsx
import React from "react";
import ReviewStepReadOnly from "./rfq-form/ReviewStepReadOnly";

/**
 * Simple overlay dialog for viewing an RFQ in read-only mode.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - rfq: {
 *      id?,
 *      publicId?,
 *      issuedAt?,
 *      validDays?,
 *      location?: { city?, emirate?, country? },
 *      orderDetails?: {...},
 *      items?: [...],
 *      // also supports some snake_case fallbacks from DB
 *    }
 */
export default function BuyerRFQViewDialog({ open, onClose, rfq }) {
  if (!open || !rfq) return null;

  // Try to be tolerant to both camelCase and snake_case inputs
  const {
    publicId,
    public_id,
    createdAt,
    created_at,
    issuedAt,
    validDays,
    location,
    orderDetails,
    items,
  } = rfq;

  const meta = {
    publicId: publicId || public_id || rfq.rfqCode || rfq.rfqId,
    issuedAt: issuedAt || createdAt || created_at || rfq.postedTime,
    validDays: validDays ?? rfq.validDays,
    location: location || {
      city: rfq.city,
      emirate: rfq.emirate,
      country: rfq.country,
    },
  };

  const od = orderDetails || rfq.orderDetails || {
    deliveryTimeline: rfq.deliveryTimeline,
    deliveryTimelineLabel: rfq.deliveryTimelineLabel,
    deliveryTerms: rfq.deliveryTerms,
    incoterms: rfq.incoterms,
    incotermsLabel: rfq.incotermsLabel,
    paymentTerms: rfq.paymentTerms,
    paymentTermsLabel: rfq.paymentTermsLabel,
    rfqValidLabel: rfq.rfqValidLabel,
  };

  const itemsArr = Array.isArray(items)
    ? items
    : Array.isArray(rfq.items)
    ? rfq.items
    : [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      {/* Clickable backdrop */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
        aria-label="Close RFQ viewer"
      />

      {/* Dialog container */}
      <div className="relative z-50 max-h-[90vh] w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              RFQ DETAILS
            </span>
            <span className="text-sm text-slate-700">
              {meta.publicId || "RFQ"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto px-6 py-4 bg-slate-50">
          <div className="mx-auto max-w-4xl">
            <ReviewStepReadOnly
              items={itemsArr}
              orderDetails={od}
              meta={meta}
              groupByCategory={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}