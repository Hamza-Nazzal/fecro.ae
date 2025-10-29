// src/components/rfq-form/ReviewStep.jsx
import React from "react";
import "./review-step.css";
import { formatDMY, addDays } from "../../utils/date";

export default function ReviewStep({
  items = [],
  orderDetails = {},
  meta = {},
  groupByCategory = false,
  onQuantityChange = null,
}) {
  const issuedAt = meta.issuedAt || new Date();
  const validDays = Number(meta.validDays ?? 14);
  const deadline = addDays(issuedAt, validDays);

  const city = meta.location?.city || "—";
  const emirate = meta.location?.emirate || "—"; // UI label: Emirate
  const country = meta.location?.country || "—";

  const rfqId = meta.publicId || meta.rfqId || "RFQ-—";

  const deliveryTimeline =
    (orderDetails.deliveryTimelineLabel ?? orderDetails.deliveryTimeline) ??
    "Standard";
  const deliveryTerms =
    (orderDetails.deliveryTermsLabel ??
      orderDetails.incotermsLabel ??
      orderDetails.deliveryTerms ??
      orderDetails.incoterms) ?? "—";
  const paymentTerms =
    (orderDetails.paymentTermsLabel ?? orderDetails.paymentTerms) ?? "Net-30";

  // Grouping helper (pure, read-only)
  const grouped = React.useMemo(() => {
    if (!groupByCategory) return null;
    const map = new Map();
    for (const it of items) {
      const key = it.categoryPath || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return Array.from(map.entries()); // [ [category, items[]], ... ]
  }, [groupByCategory, items]);

  // Quantity change handlers
  const handleIncrement = (item) => {
    if (onQuantityChange) {
      const newQuantity = (item.quantity || 1) + 1;
      onQuantityChange(item.id || item.key, newQuantity);
    }
  };

  const handleDecrement = (item) => {
    if (onQuantityChange) {
      const currentQuantity = item.quantity || 1;
      const newQuantity = Math.max(1, currentQuantity - 1); // Minimum quantity is 1
      onQuantityChange(item.id || item.key, newQuantity);
    }
  };

  return (
    <div className="rfq-review paper">
      {/* v6-style header */}
      <header className="header text-center mb-7">
        <h1 className="title">REQUEST FOR QUOTATION (RFQ)</h1>
        <div className="muted">
          {rfqId} · Date Issued: {formatDMY(issuedAt)}
        </div>
      </header>

      <h2 className="section-title">1. RFQ Summary</h2>
      <table className="kv">
        <tbody>
          <tr>
            <th>Customer</th>
            <td>
              <em>
                Your company details are only revealed after you accept a
                quotation.
              </em>
            </td>
          </tr>
          <tr>
            <th>Location</th>
            <td>
              {city}, {emirate}, {country}
            </td>
          </tr>
          <tr>
            <th>RFQ Valid for</th>
            <td>
              {orderDetails.rfqValidLabel ||
                (meta.validDays ? `${meta.validDays}-days` : "—")}
            </td>
          </tr>
          <tr>
            <th>Total Items</th>
            <td>
              {items.length} {items.length === 1 ? "product" : "products"}
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-[22px] font-bold tracking-wide uppercase text-slate-900 mb-4">
        2. Requested Items
      </h2>

      {groupByCategory ? (
        /* =========== GROUPED VIEW (toggleable) =========== */
        <div className="space-y-6">
          {grouped.map(([category, groupItems], gi) => (
            <div key={category + gi} className="mb-6">
              {/* Category Header with L-shaped line */}
              <div className="relative bg-gray-100">
                {/* Horizontal line on top */}
                <div className="h-[2px] bg-blue-600 w-full"></div>
                {/* Vertical line on left */}
                <div className="absolute top-0 left-0 w-[4px] h-full bg-blue-600"></div>
                {/* Category text */}
                <div className="pl-6 py-3">
                  <div className="text-slate-900 font-semibold uppercase tracking-wide text-[15px]">
                    {category ? category.toUpperCase() : "—"}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mt-4">
                {groupItems.map((it, idx) => (
                  <div key={it.id || idx} className="relative">
                    {/* Vertical line on left side of item */}
                    <div className="absolute top-0 left-0 w-[2px] h-full bg-blue-600"></div>
                    
                    {/* Item Header Row */}
                    <div className="pl-6 pr-4 pt-4 pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-baseline gap-2">
                          <div className="text-[12px] uppercase tracking-wider text-slate-500">
                            Item #{idx + 1}
                          </div>
                          <div className="text-[18px] font-semibold text-slate-900">
                            {it.name || "Product name"}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Qty pill */}
                          <div className="flex items-center gap-2 bg-green-100 text-green-900 rounded-full px-3 py-1 text-[14px]">
                            <button
                              type="button"
                              className="h-6 w-6 rounded-full border border-green-300 grid place-items-center hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleDecrement(it)}
                              disabled={(it.quantity || 1) <= 1}
                              aria-label="decrease quantity"
                            >−</button>
                            <span className="font-semibold">Qty: {it.quantity ?? 1}</span>
                            <button
                              type="button"
                              className="h-6 w-6 rounded-full border border-green-300 grid place-items-center hover:bg-green-200"
                              onClick={() => handleIncrement(it)}
                              aria-label="increase quantity"
                            >+</button>
                          </div>

                          {/* Edit button */}
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-500 text-blue-700 px-3 py-1.5 text-[14px] hover:bg-blue-50"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="pl-6 pr-4 pb-5">
                      <div className="text-[12px] uppercase tracking-wider text-slate-500 mb-2">
                        Product Details
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(it.specs) && it.specs.length ? (
                          it.specs.map((s, i) => (
                            <span
                              key={i}
                              className="spec-chip"
                            >
                              <span className="font-semibold">{s.label}:</span>&nbsp;{String(s.value)}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </div>

                    {/* Item Separator */}
                    {idx < groupItems.length - 1 && (
                      <hr className="mx-6 my-3 border-t border-slate-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* =========== STACKED VIEW (default) =========== */
        <div className="items">
          {items.map((it, idx) => (
            <div key={it.id || idx} className="item">
              <div className="name-row">
                <div className="name-block">
                  <div className="category-path">
                    {it.categoryPath || "—"}
                  </div>

                  {/* Product name + Qty inline (far right) */}
                  <div className="name-head">
                    <h3 className="product-name">
                      {it.name ? it.name : "Product name"}
                    </h3>
                    <div className="qty-box" aria-label="Quantity">
                      <span className="lbl">Qty:</span>
                      <span className="num">{it.quantity ?? 1}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specs under header row */}
                {Array.isArray(it.specs) && it.specs.length ? (
                  <div className="specs-pills" role="list">
                    <div className="specs-cap">Specifications</div>
                    {it.specs.map((s, i) => (
                      <span key={i} role="listitem" className="spec-pill">
                        <span className="k">{s.label}:</span>
                        <span className="v">{String(s.value)}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="specs-pills specs-pills--empty">—</div>
                )}
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">3. Order &amp; Payment Terms</h2>
      <table className="terms">
        <tbody>
          <tr>
            <th>Delivery Timeline</th>
            <td>{deliveryTimeline}</td>
          </tr>
          <tr>
            <th>Delivery Terms</th>
            <td>{deliveryTerms}</td>
          </tr>
          <tr>
            <th>Payment Terms</th>
            <td>{paymentTerms}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="section-title">4. Submission Instructions</h2>
      <p className="mb-8">
        Please submit your quotation before{" "}
        <strong>{formatDMY(deadline)}</strong> on{" "}
        <strong>fecro.ae</strong>.
      </p>
    </div>
  );
}