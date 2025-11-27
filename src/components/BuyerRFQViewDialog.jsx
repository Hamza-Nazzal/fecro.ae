// src/components/BuyerRFQViewDialog.jsx
import React from "react";
import ReviewStepReadOnly from "./rfq-form/ReviewStepReadOnly";

/**
 * Simple overlay dialog for viewing an RFQ in read-only mode.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - rfq: RFQ card / RFQ object as used across the app
 */
export default function BuyerRFQViewDialog({ open, onClose, rfq }) {
  if (!open || !rfq) return null;

  const headerPublicId =
    rfq.publicId ||
    rfq.public_id ||
    rfq.rfqCode ||
    rfq.rfqId ||
    "RFQ";

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
              {headerPublicId}
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
            <ReviewStepReadOnly rfq={rfq} />
          </div>
        </div>
      </div>
    </div>
  );
}