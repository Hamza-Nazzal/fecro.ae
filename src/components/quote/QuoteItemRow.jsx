// src/components/quote/QuoteItemRow.jsx
import React from "react";

export default function QuoteItemRow({ row = {}, onChangeItem = () => {} }) {
  const { rfqItem = null, i = -1, quoteItem = {} } = row || {};
  if (!rfqItem) return null;

  const readOnly = typeof i !== "number" || i < 0;
  const handle = (patch) => {
    if (readOnly) return;
    onChangeItem(i, patch);
  };

  // 🔹 Prefer specs injected by ItemsSection, fall back to quoteItem._specs
  const specs = Array.isArray(rfqItem.specs) && rfqItem.specs.length
    ? rfqItem.specs
    : Array.isArray(quoteItem._specs)
      ? quoteItem._specs
      : [];

  // Keep ack state serializable
  const ack = quoteItem._ackSpecs instanceof Set
    ? quoteItem._ackSpecs
    : new Set(Array.isArray(quoteItem._ackSpecs) ? quoteItem._ackSpecs : []);

  const toggleAck = (joined) => {
    if (readOnly) return;
    const next = new Set(ack);
    next.has(joined) ? next.delete(joined) : next.add(joined);
    handle({ _ackSpecs: Array.from(next) });
  };

  const unitPrice = Number(quoteItem.unitPrice || 0);
  const qtyOffer = Number(quoteItem.qtyOffer || 0);
  const discountType = quoteItem.discountType || "none";
  const discountValue = Number(quoteItem.discountValue || 0);

  let lineTotal = unitPrice * qtyOffer;
  if (discountType === "amount") lineTotal = Math.max(0, lineTotal - discountValue);
  if (discountType === "percent") lineTotal = Math.max(0, lineTotal * (1 - discountValue / 100));

  return (
    <div className="quote-row">
      <div className="quote-row__left">
        <div className="quote-row__title">
          {rfqItem.product_name || rfqItem.name || "Item"}
        </div>

        <div className="quote-row__specs">
          <div className="quote-row__specs-label">Buyer request</div>
          <div className="quote-row__specs-pills">
            {specs.length === 0 ? (
              <span className="muted">—</span>
            ) : (
              specs.map((s, idx) => {
                const key = s.key_label || s.key || s.name || `k${idx}`;
                const val = s.value ?? s.val ?? s.v ?? "";
                const joined = `${key}: ${val}`;
                const active = ack.has(joined);
                return (
                  <button
                    key={joined}
                    type="button"
                    className={`spec-pill ${active ? "active" : ""} ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                    onClick={() => toggleAck(joined)}
                    disabled={readOnly}
                    title={readOnly ? "Initializing…" : "Click to acknowledge / unacknowledge"}
                  >
                    {active ? "✓" : "+"} {joined}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="quote-row__right">
        <div className="form-grid">
          <label className="fld">
            <span className="lbl">Price per unit</span>
            <input
              className="inp"
              type="number"
              min="0"
              step="0.01"
              value={quoteItem.unitPrice ?? ""}
              onChange={(e) => handle({ unitPrice: e.target.value })}
              onBlur={(e) => handle({ unitPrice: Number(e.target.value || 0) })}
              placeholder="0.00"
              disabled={readOnly}
            />
          </label>

          <label className="fld">
            <span className="lbl">Unit</span>
            <select
              className="inp"
              value={quoteItem.unit || "piece"}
              onChange={(e) => handle({ unit: e.target.value })}
              disabled={readOnly}
            >
              <option value="piece">piece</option>
              <option value="box">box</option>
              <option value="pack">pack</option>
            </select>
          </label>

          <label className="fld">
            <span className="lbl">Qty offer</span>
            <input
              className="inp"
              type="number"
              min="0"
              step="1"
              value={quoteItem.qtyOffer ?? ""}
              onChange={(e) => handle({ qtyOffer: e.target.value })}
              onBlur={(e) => handle({ qtyOffer: Number(e.target.value || 0) })}
              placeholder="0"
              disabled={readOnly}
            />
          </label>

          <label className="fld">
            <span className="lbl">Discount</span>
            <div className="discount-combo">
              <select
                className="inp"
                value={discountType}
                onChange={(e) => handle({ discountType: e.target.value })}
                disabled={readOnly}
              >
                <option value="none">None</option>
                <option value="amount">Amount</option>
                <option value="percent">% Percent</option>
              </select>
              <input
                className="inp"
                type="number"
                min="0"
                step="0.01"
                disabled={readOnly || discountType === "none"}
                value={quoteItem.discountValue ?? ""}
                onChange={(e) => handle({ discountValue: e.target.value })}
                onBlur={(e) => handle({ discountValue: Number(e.target.value || 0) })}
                placeholder="0"
              />
            </div>
          </label>

          <div className="fld total">
            <span className="lbl">Line total</span>
            <div className="line-total">AED {lineTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}