// src/components/quote/QuoteTerms.jsx
import React from "react";

/**
 * Presentational section for Dates & Terms on the seller quotation.
 * Pure UI: expects already-normalized props from the parent.
 * Styles are defined in seller-quote.css and use the BEM-ish classes below.
 */
export default function QuoteTerms({
  deliveryTerms = "",
  paymentTerms = "",
  shippingTerms = "",
  validityDays = null,
  deliveryDays = null,
}) {
  const renderValue = (val) => {
    const s = (val ?? "").toString().trim();
    return s ? <span className="quote-terms__value">{s}</span> : <span className="quote-terms__empty">—</span>;
  };

  const renderDays = (n) => {
    const num = Number(n);
    return Number.isFinite(num) && num > 0
      ? <span className="quote-terms__value">{num} days</span>
      : <span className="quote-terms__empty">—</span>;
  };

  return (
    <section className="quote-section print-break quote-terms">
      <div className="quote-section__title">Dates &amp; Terms</div>

      <div className="quote-terms__grid">
        <div className="quote-terms__row">
          <div className="quote-terms__label">Delivery Terms</div>
          {renderValue(deliveryTerms)}
        </div>

        <div className="quote-terms__row">
          <div className="quote-terms__label">Payment Terms</div>
          {renderValue(paymentTerms)}
        </div>

        <div className="quote-terms__row">
          <div className="quote-terms__label">Quote Validity</div>
          {renderDays(validityDays)}
        </div>

        <div className="quote-terms__row">
          <div className="quote-terms__label">Delivery Days</div>
          {renderDays(deliveryDays)}
        </div>

        <div className="quote-terms__row">
          <div className="quote-terms__label">Shipping Terms</div>
          {renderValue(shippingTerms)}
        </div>
      </div>
    </section>
  );
}