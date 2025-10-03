// src/components/quote/QuoteTotals.jsx

import React from "react";

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between">
      <div className={`text-gray-600 ${strong ? "font-semibold text-gray-900" : ""}`}>{label}</div>
      <div className={`tabular-nums ${strong ? "font-semibold" : ""}`}>AED {Number(value || 0).toFixed(2)}</div>
    </div>
  );
}

export default function QuoteTotals({ header, totals, onChangeHeader }) {
  const { itemsTotal, subtotalAfterDiscount, taxAmount, grandTotal } = totals;

  return (
    <section className="rounded border bg-white">
      <div className="px-4 py-2 border-b bg-gray-50 font-medium">Totals &amp; VAT</div>
      <div className="p-4 space-y-3 text-sm">
        <Row label="Items total (pre-discount)" value={itemsTotal} />
        <div className="flex items-center justify_between gap-4">
          <div className="text-gray-600">Overall discount</div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">AED</span>
            <input
              className="w-32 border rounded px-3 py-1.5 text-right"
              inputMode="decimal"
              value={header.overallDiscount ?? 0}
              onChange={e => onChangeHeader({ overallDiscount: e.target.value })}
            />
          </div>
        </div>
        <Row label="Subtotal (after discount)" value={subtotalAfterDiscount} />
        <Row label={`VAT ${header.taxPercent || 5}% on Subtotal`} value={taxAmount} />
        <hr />
        <Row label="Grand total" value={grandTotal} strong />
      </div>
    </section>
  );
}
