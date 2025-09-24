// src/components/QuotationForm.jsx
//src/components/QuotationForm.jsx
import React from "react";
import { Plus, Trash2, Send, X, Loader2 } from "lucide-react";
import useSubmitQuotation from "../hooks/useSubmitQuotation";

export default function QuotationForm({ rfq, seller, onClose, onSubmitted }) {
  const {
    form,
    updateField,
    updateLine,
    addLine,
    removeLine,
    totals,
    errors,
    submitting,
    submit,
  } = useSubmitQuotation({ rfq, seller });

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await submit();
    if (res.ok) {
      try {
        window.dispatchEvent(new CustomEvent("quotation:submitted", { detail: res.data }));
      } catch {}
      onSubmitted?.(res.data);
      onClose?.();
    }
  }

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Send quotation for {rfq.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-xl"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="AED">AED</option>
            </select>
            {errors.currency && (
              <p className="text-red-600 text-xs mt-1">{errors.currency}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Delivery timeline (days)
            </label>
            <input
              type="number"
              min={1}
              value={form.deliveryTimelineDays}
              onChange={(e) => updateField("deliveryTimelineDays", e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="e.g. 3"
            />
            {errors.deliveryTimelineDays && (
              <p className="text-red-600 text-xs mt-1">
                {errors.deliveryTimelineDays}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Validity (days)
            </label>
            <input
              type="number"
              min={1}
              value={form.validityDays}
              onChange={(e) => updateField("validityDays", e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="30"
            />
            {errors.validityDays && (
              <p className="text-red-600 text-xs mt-1">
                {errors.validityDays}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Payment terms
            </label>
            <input
              type="text"
              value={form.paymentTerms}
              onChange={(e) => updateField("paymentTerms", e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Net 30"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">
              Shipping terms
            </label>
            <input
              type="text"
              value={form.shippingTerms}
              onChange={(e) => updateField("shippingTerms", e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="FOB Origin"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Line items</label>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 hover:bg-gray-50"
            >
              <Plus size={16} /> Add item
            </button>
          </div>

          <div className="space-y-2">
            {form.lineItems.map((li, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 items-center rounded-xl border p-2"
              >
                <input
                  className="col-span-5 rounded-lg border px-3 py-2"
                  placeholder="Item"
                  value={li.item}
                  onChange={(e) => updateLine(i, { item: e.target.value })}
                />
                <input
                  type="number"
                  min={1}
                  className="col-span-2 rounded-lg border px-3 py-2"
                  placeholder="Qty"
                  value={li.quantity}
                  onChange={(e) => updateLine(i, { quantity: e.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="col-span-3 rounded-lg border px-3 py-2"
                  placeholder="Unit price"
                  value={li.unitPrice}
                  onChange={(e) =>
                    updateLine(i, { unitPrice: e.target.value })
                  }
                />
                <div className="col-span-1 text-right font-medium">
                  {(Number(li.quantity || 0) * Number(li.unitPrice || 0)).toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="col-span-1 justify-self-end p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="Remove line"
                >
                  <Trash2 size={16} />
                </button>

                {errors[`li_${i}_item`] && (
                  <p className="col-span-12 text-xs text-red-600">
                    {errors[`li_${i}_item`]}
                  </p>
                )}
                {errors[`li_${i}_qty`] && (
                  <p className="col-span-12 text-xs text-red-600">
                    {errors[`li_${i}_qty`]}
                  </p>
                )}
                {errors[`li_${i}_price`] && (
                  <p className="col-span-12 text-xs text-red-600">
                    {errors[`li_${i}_price`]}
                  </p>
                )}
              </div>
            ))}
            {errors.lineItems && (
              <p className="text-xs text-red-600">{errors.lineItems}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
          <div className="text-sm text-gray-600">
            Subtotal&nbsp;=&nbsp;sum(items)
          </div>
          <div className="text-lg font-semibold">
            <p>Total: {totals.totalPrice.toFixed(2)} {form.currency}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Anything the buyer should know..."
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send quote
          </button>
        </div>
      </form>
    </div>
  );
}
