// src/components/quote/QuoteHeader.jsx
import React from "react";

function safeDate(d) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function QuoteHeader({
  rfq = {},
  showParties = false, // stays false for seller anonymous view
}) {
  const status = rfq.status || "draft";
  const sellerRfqId = rfq.sellerRfqId || rfq.publicId || "—";
  const created = safeDate(rfq.createdAt);
  const expires = safeDate(rfq.expiresAt);

  return (
    <section className="quote-section print-break">
      <div className="quote-header">
        <div className="title">Seller RFQ—</div>
        <div className="meta">
          <span className="badge">Quotation #—</span>
          <span className="badge">Status: {status}</span>
          <span className="badge">{sellerRfqId}</span>
        </div>

        <div className="meta">
          <span>Created on: {created}</span>
          <span>Expiry date: {expires}</span>
          <span>Currency: AED</span>
        </div>

        {!showParties && (
          <div className="meta">
            <div>
              <strong>Supplier name:</strong>{" "}
              hidden for now — if the buyer accepts your quotation and you agree
              to share, your company details will be revealed.
            </div>
            <div>
              <strong>Buyer name:</strong>{" "}
              hidden — becomes visible only after buyer accepts your quotation.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}