// src/components/rfq-form/ReviewStep.jsx
import React from "react";
import "./review-step.css";
import { formatDMY, addDays } from "../../utils/date";

export default function ReviewStep({
  items = [],
  orderDetails = {},
  meta = {},
  groupByCategory = false,
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

      <h2 className="section-title">2. Requested Items</h2>

      {groupByCategory ? (
        /* =========== GROUPED VIEW (toggleable) =========== */
        <div className="items">
          {grouped.map(([category, groupItems], gi) => (
            <div key={category + gi} className="group">
              {/* Grouping Header: visual break, not repeated per item */}
              <div className="group-header">
                <div className="group-title">{category || "—"}</div>
              </div>

              {/* Product rows under the header, with Qty inline on the right */}
              <ul className="group-list">
                {groupItems.map((it, idx) => (
                  <li key={it.id || idx} className="group-item">
                    {/* Head row: product name + qty (inline, far right) */}
                    <div className="group-head">
                      <div className="group-product">
                        {it.name || "Product name"}
                      </div>
                      <div className="qty-box" aria-label="Quantity">
                        <span className="lbl">Qty:</span>
                        <span className="num">{it.quantity ?? 1}</span>
                      </div>
                    </div>

                    {/* Specs under the head row */}
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
                  </li>
                ))}
              </ul>
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