//src/components/quote/CategoryGroup.jsx

import React from "react";
import QuoteItemRow from "./QuoteItemRow";

export default function CategoryGroup({ title, rows = [], onChangeItem }) {
  const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : [];

  if (safeRows.length === 0) return null;

  return (
    <section className="rounded-lg border bg-white">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-gray-500">
          Requested {safeRows.length} item{safeRows.length > 1 ? "s" : ""}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {safeRows.map((row, idx) => (
          <QuoteItemRow
            key={row?.rfqItem?.id || row?.rfqItem?.rfq_item_id || idx}
            row={row}
            onChangeItem={onChangeItem}
          />
        ))}
      </div>
    </section>
  );
}