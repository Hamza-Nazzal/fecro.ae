// src/components/quote/ItemsSection.jsx
import React, { useMemo } from "react";
import QuoteItemRow from "./QuoteItemRow.jsx";

export default function ItemsSection({
  title = "Items",
  items,
  quoteItems,
  emptyMessage = "No items added yet.",
}) {
  const rfqItems = Array.isArray(items) ? items : [];
  const quoteItemsList = Array.isArray(quoteItems) ? quoteItems : [];

  const grouped = useMemo(() => {
    const byCat = new Map();
    const quoteByItemId = new Map();

    for (const qi of quoteItemsList) {
      const key =
        qi?.rfq_item_id ??
        qi?.rfqItemId ??
        qi?.rfq_item ??
        qi?.item_id ??
        qi?.itemId ??
        null;
      if (!key) continue;
      if (!quoteByItemId.has(key)) {
        quoteByItemId.set(key, qi);
      }
    }

    rfqItems.forEach((raw, idx) => {
      if (!raw || typeof raw !== "object") return;
      const cat = raw.categoryPath || raw.category || raw.category_path || "General";
      if (!byCat.has(cat)) byCat.set(cat, []);
      const rfqItemId = raw.id ?? raw.rfq_item_id ?? raw.item_id ?? null;
      const quoteItem = rfqItemId ? quoteByItemId.get(rfqItemId) || null : null;
      const specs = Array.isArray(raw.specs) && raw.specs.length
        ? raw.specs
        : quoteItem?._specs || [];
      byCat.get(cat).push({
        rfqItem: { ...raw, specs },
        i: idx,
        quoteItem,
        id: rfqItemId,
      });
    });

    return Array.from(byCat.entries()).map(([category, rows]) => ({ category, rows }));
  }, [rfqItems, quoteItemsList]);

  const hasItems = rfqItems.length > 0 && grouped.length > 0;

  return (
    <section className="space-y-4">
      {title && <h2 className="text-sm font-semibold text-slate-700">{title}</h2>}
      {!hasItems ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        grouped.map(({ category, rows }) => (
          <div key={category} className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {category}
            </div>
            <div className="space-y-3">
              {rows.map(({ rfqItem, i, quoteItem, id }) => (
                <QuoteItemRow
                  key={id || rfqItem?.id || i}
                  index={i}
                  rfqItem={rfqItem}
                  quoteItem={quoteItem}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
