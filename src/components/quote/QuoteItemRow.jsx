// src/components/quote/QuoteItemRow.jsx
import React from "react";

export default function QuoteItemRow({ rfqItem, quoteItem, index }) {
  if (!rfqItem) return null;

  const name =
    rfqItem.productName ??
    rfqItem.name ??
    `Item${typeof index === "number" ? ` ${index + 1}` : ""}`;
  const quantity = rfqItem.quantity ?? rfqItem.qty ?? null;
  const category = rfqItem.categoryPath ?? rfqItem.category ?? "";
  const specs = Array.isArray(rfqItem?.specs)
    ? rfqItem.specs
    : Array.isArray(quoteItem?._specs)
    ? quoteItem._specs
    : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">
            {typeof index === "number" ? `${index + 1}. ` : ""}
            {name}
          </div>
          {category && <div className="mt-1 truncate text-xs text-slate-500">{category}</div>}
        </div>
        {quantity != null && (
          <div className="text-right text-sm text-slate-600">
            <div className="font-medium text-slate-900">{quantity}</div>
            <div className="text-xs text-slate-500">Qty</div>
          </div>
        )}
      </div>

      <div className="mt-3">
        {Array.isArray(specs) && specs.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {specs.map((spec, idx) => {
              if (!spec || !spec.key_label || !spec.value) return null;
              return (
                <span
                  key={`${spec.key_label}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                >
                  <span className="text-green-600">✓</span>
                  <span className="font-medium text-slate-600">{spec.key_label}</span>
                  <span>
                    {spec.value}
                    {spec.unit ? ` ${spec.unit}` : ""}
                  </span>
                </span>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
            No specifications provided.
          </div>
        )}
      </div>
    </div>
  );
}
