// src/components/quote/ItemsSection.jsx
import React from "react";
import CategoryGroup from "./CategoryGroup";
import {
  getRfqItems,
  getCategoryPath,
  getItemId,
} from "../../hooks/useRfqItems";

export default function ItemsSection({ rfq, items, onChangeItem }) {
  const grouped = React.useMemo(() => {
    const byCat = new Map();
    const rfqItems = getRfqItems(rfq);

    rfqItems.forEach((raw) => {
      const cat = getCategoryPath(raw) || "Uncategorized";
      if (!byCat.has(cat)) byCat.set(cat, []);

      const rid = getItemId(raw);
      const idx = items.findIndex((x) => x?.rfqItemId === rid);
      const qi = idx >= 0 ? items[idx] : null;

      // 🔹 Normalize specs from multiple possible shapes
      const specs =
        raw.specs ||
        raw.spec_list ||
        (raw.specs_map
          ? Object.entries(raw.specs_map).map(([key, value]) => ({
              key_label: key,
              value,
            }))
          : qi?._specs || []);

      byCat.get(cat).push({
        rfqItem: { ...raw, specs },
        i: idx,
        quoteItem: qi,
      });
    });

    return byCat;
  }, [rfq, items]);

  const entries = [...grouped.entries()];
  if (entries.length === 0) {
    return (
      <div className="rounded border bg-white p-4 text-sm text-gray-500">
        No RFQ items found for this request.
      </div>
    );
  }

  return (
    <>
      {entries.map(([categoryPath, rows]) => (
        <CategoryGroup
          key={categoryPath}
          title={categoryPath}
          rows={rows}
          onChangeItem={onChangeItem}
        />
      ))}
    </>
  );
}

