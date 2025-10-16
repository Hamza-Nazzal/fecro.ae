// src/components/quote/QuoteTotals.jsx
import React from "react";

function fmtAED(n) {
  return `AED ${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

export default function QuoteTotals({
  currency = "AED",
  subtotal = 0,
  discountAmount = 0,
  discountPercent = null, // if provided, show next to label
  vatRate = 5,
  grandTotal = 0,
}) {
  const vatAmount = (Number(subtotal) - Number(discountAmount || 0)) * (Number(vatRate) / 100);

  return (
    <section className="quote-section print-break quote-totals">
      <div className="row">
        <div>Subtotal</div>
        <div className="num">
          {currency === "AED" ? fmtAED(subtotal) : `${currency} ${subtotal}`}
        </div>
      </div>

      <div className="row">
        <div>
          Discount {discountPercent != null ? `(${discountPercent}%)` : ""}
        </div>
        <div className="num">
          {currency === "AED" ? fmtAED(discountAmount) : `${currency} ${discountAmount}`}
        </div>
      </div>

      <div className="row">
        <div>VAT ({vatRate}%)</div>
        <div className="num">
          {currency === "AED" ? fmtAED(vatAmount) : `${currency} ${vatAmount}`}
        </div>
      </div>

      <div className="divider" />

      <div className="row grand">
        <div>Total</div>
        <div className="num">
          {currency === "AED" ? fmtAED(grandTotal) : `${currency} ${grandTotal}`}
        </div>
      </div>
    </section>
  );
}