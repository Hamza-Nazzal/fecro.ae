// src/components/quote/QuoteHeader.jsx

import React from "react";

export default function QuoteHeader({ rfq, header, onChange, autosaveAt }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">Draft {autosaveAt ? `• Autosaved ${autosaveAt.toLocaleTimeString()}` : ""}</div>
        <div className="text-sm">Status: <span className="font-medium">{header.status || "draft"}</span></div>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div><span className="text-gray-500 mr-1">SRFQ:</span><span className="font-medium">{rfq?.publicId || rfq?.id}</span></div>
          <div className="text-gray-300">•</div>
          <div><span className="text-gray-500 mr-1">Incoterms:</span>{header.deliveryIncoterm || "—"}</div>
          <div className="text-gray-300">•</div>
          <div><span className="text-gray-500 mr-1">Payment:</span>{header.paymentTerms || "—"}</div>
          <div className="text-gray-300">•</div>
          <div><span className="text-gray-500 mr-1">Delivery:</span>{header.deliveryDays ? `${header.deliveryDays} days` : "—"}</div>
        </div>

        <div className="mt-3">
          <label className="block text-sm text-gray-600 mb-1">Internal reference (optional)</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., ERP-QUOTE-123"
            value={header.internalReference || ""}
            onChange={e => onChange({ internalReference: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
