// src/components/quote/CategoryGroup.jsx
import React from "react";
import QuoteItemRow from "./QuoteItemRow";

/**
 * Renders a category section with multiple items.
 * Props:
 *  - categoryPath: full path string or label
 *  - items: array of items (each consumed by QuoteItemRow)
 */
export default function CategoryGroup({ categoryPath, items = [] }) {
  const label = categoryPath || "Uncategorized";

  return (
    <section className="quote-section">
      <h3 className="quote-section__title">{label}</h3>

      <div className="quote-list">
        {items.map((it, idx) => (
          <QuoteItemRow key={idx} item={it} />
        ))}
      </div>
    </section>
  );
}