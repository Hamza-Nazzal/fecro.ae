// src/components/quote/QuoteItemRow.jsx

import React from "react";

/**
 * One line item row inside a category group.
 * Expects `item` with fields that may vary:
 *  - name/title/productName
 *  - quantity
 *  - specifications | specs (array)   [may be empty]
 *  - specsPreview (array of strings)  [optional]
 *  - categoryPath | category_path     [optional]
 */
export default function QuoteItemRow({ item }) {
  if (!item) return null;

  const name =
    item.productName ??
    item.name ??
    item.title ??
    (typeof item === "string" ? item : "Item");

  const qty = Number.isFinite(Number(item.quantity))
    ? Number(item.quantity)
    : null;

  const catPath = item.categoryPath || item.category_path || "";
  const categoryTail = typeof catPath === "string" && catPath.includes(" → ")
    ? catPath.split(" → ").pop()
    : "";

  // normalize specs (array of objects) if provided
  const rawSpecs = Array.isArray(item.specifications)
    ? item.specifications
    : Array.isArray(item.specs)
    ? item.specs
    : [];

  const specPairs = rawSpecs
    .map((s) => {
      const label = (s?.key_label || s?.key_norm || "").trim();
      const value = (s?.value ?? "").toString().trim();
      const unit  = (s?.unit ?? "").toString().trim();
      if (!label || !value) return null;
      const display = unit ? `${value} ${unit}` : value;
      return display ? `${label}: ${display}` : null;
    })
    .filter(Boolean);

  // optional pre-baked preview pills
  const pills = Array.isArray(item.specsPreview) ? item.specsPreview : [];

  return (
    <div className="quote-item">
      {/* Left: name + category */}
      <div className="quote-item__main">
        <div className="quote-item__title">
          {name}
          {categoryTail && <span className="quote-item__cat"> — {categoryTail}</span>}
        </div>

        {/* Specs (structured) */}
        {specPairs.length > 0 && (
          <div className="quote-item__specs">
            {specPairs.slice(0, 3).map((txt, i) => (
              <span key={`spec-${i}`} className="spec-pill spec-pill--blue" title={txt}>
                {txt}
              </span>
            ))}
          </div>
        )}

        {/* Optional pills preview */}
        {specPairs.length === 0 && pills.length > 0 && (
          <div className="quote-item__specs">
            {pills.slice(0, 3).map((txt, i) => (
              <span key={`pill-${i}`} className="spec-pill" title={txt}>
                {txt}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: qty */}
      <div className="quote-item__qty">
        {Number.isFinite(qty) && qty > 0 ? `Qty: ${qty}` : ""}
      </div>
    </div>
  );
}