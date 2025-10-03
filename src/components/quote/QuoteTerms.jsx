// src/components/quote/QuoteTerms.jsx

import React from "react";

export default function QuoteTerms({ header, onChange }) {
  const adjustValidity = (delta) => {
    const next = Math.max(1, Math.min(30, (+header.validityDays || 0) + delta));
    onChange({ validityDays: next });
  };

  return (
    <section className="rounded border bg-white">
      <div className="px-4 py-2 border-b bg-gray-50 font-medium">Commercial terms</div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Payment terms</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={header.paymentTerms || ""}
            onChange={e => onChange({ paymentTerms: e.target.value })}
          >
            <option value="">Select…</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 45">Net 45</option>
            <option value="Advance 50%">Advance 50%</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Delivery (Incoterm)</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={header.deliveryIncoterm || ""}
            onChange={e => onChange({ deliveryIncoterm: e.target.value })}
          >
            <option value="">Select…</option>
            <option value="DAP">DAP</option>
            <option value="FOB">FOB</option>
            <option value="EXW">EXW</option>
          </select>

          <div className="mt-2">
            <label className="text-sm text-gray-600 mr-2">Delivery days</label>
            <input
              className="w-28 border rounded px-3 py-2"
              inputMode="numeric"
              value={header.deliveryDays ?? 0}
              onChange={e => onChange({ deliveryDays: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Quote validity (days)</label>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border rounded" onClick={() => adjustValidity(-1)}>−</button>
            <input
              className="w-20 text-center border rounded px-3 py-2"
              inputMode="numeric"
              value={header.validityDays ?? 7}
              onChange={e => {
                const v = Math.max(1, Math.min(30, +e.target.value || 0));
                onChange({ validityDays: v });
              }}
            />
            <button className="px-2 py-1 border rounded" onClick={() => adjustValidity(1)}>+</button>
          </div>
        </div>
      </div>
    </section>
  );
}
