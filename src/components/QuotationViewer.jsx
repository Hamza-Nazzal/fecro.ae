// src/components/QuotationViewer.jsx
//src/components/QuotationViewer.jsx
import React from "react";
import { X, Calendar, Package, Truck, FileText } from "lucide-react";
import { formatDMY, addDays } from "../utils/date";
// import "./quote/seller-quote.css";


// VAT / totals helpers (5% now, future-proof later)
const getVatRate = (quotation) => {
  const vatFromModel = Array.isArray(quotation?.taxes)
    ? quotation.taxes.find((t) => (t.code || t.label || "").toUpperCase() === "VAT")?.rate
    : quotation?.vatRate ?? quotation?.taxRate;
  const rate = typeof vatFromModel === "number" ? vatFromModel : 0.05; // default 5%
  return Math.max(0, rate);
};

const calcTotalsWithVat = (quotation) => {
  const items = Array.isArray(quotation?.lineItems) ? quotation.lineItems : [];
  const currency = quotation?.currency || "AED";

  const subtotal = items.reduce((sum, it) => {
    const q = Number(it?.quantity ?? 0);
    const up = Number(it?.unitPrice ?? it?.unit_price ?? 0);
    const line = Number(it?.total ?? q * up);
    return sum + (isFinite(line) ? line : 0);
  }, 0);

  const discountPct = Number(quotation?.discountPct ?? quotation?.discount_percent ?? 0);
  const discountAmtExplicit = Number(quotation?.discountAmount ?? quotation?.discount_amount ?? 0);
  const discountFromPct = discountPct > 0 ? (subtotal * discountPct) / 100 : 0;
  const discount = Math.max(0, discountAmtExplicit || discountFromPct);

  const taxableBase = Math.max(0, subtotal - discount);
  const vatRate = getVatRate(quotation);
  const vat = taxableBase * vatRate;
  const total = taxableBase + vat;

  return { currency, subtotal, discount, vatRate, vat, total, discountPct };
};

export default function QuotationViewer({ quotation, onClose }) {
  if (!quotation) return null;

  // Canonical date fields with fallbacks
  const createdAt = quotation.createdAt || quotation.created_at || null;
  const explicitExpiry = quotation.expiresAt || quotation.expires_at || null;
  const derivedExpiry =
    explicitExpiry ||
    (quotation.validityDays && createdAt ? addDays(createdAt, quotation.validityDays) : null);

  const formatCurrency = (amount, currency = "AED") => {
    const numAmount = Number(amount) || 0;
    return `${currency} ${numAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateLike) => {
    if (!dateLike) return "—";
    try {
      return formatDMY(dateLike);
    } catch {
      try {
        return new Date(dateLike).toLocaleDateString("en-GB"); // DD/MM/YYYY fallback
      } catch {
        return "—";
      }
    }
  };

  const statusStyles = {
    draft: "bg-gray-100 text-gray-800",
    submitted: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    withdrawn: "bg-orange-100 text-orange-800",
    expired: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quotation Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {quotation.rfq?.sellerRfqId || "—"}
            </p>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-4">
              <span>
                Created: <strong>{formatDate(createdAt)}</strong>
              </span>
              {derivedExpiry && (
                <span>
                  Expiry: <strong>{formatDate(derivedExpiry)}</strong>
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center justify-between">
            <div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusStyles[quotation.status] || statusStyles.draft
                }`}
              >
                {quotation.status
                  ? quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)
                  : "Draft"}
              </span>
            </div>
            {(() => {
              const { currency, total } = calcTotalsWithVat(quotation);
              const fmt = (n) =>
                `${currency} ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
              return (
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{fmt(total)}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              );
            })()}
          </div>

          {/* RFQ Details */}
          {quotation.rfq && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Request Details</h3>
              <div className="text-sm text-gray-600">
                <div><strong>Title:</strong> {quotation.rfq.title}</div>
                <div><strong>Company:</strong> {quotation.rfq.company}</div>
                <div><strong>Status:</strong> {quotation.rfq.status}</div>
              </div>
            </div>
          )}

          {/* Line Items */}
          {quotation.lineItems && quotation.lineItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Package size={18} className="mr-2" />
                Line Items
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Unit Price</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quotation.lineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.item ?? item.name ?? item.title ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatCurrency(item.unitPrice, quotation.currency)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(Number(item.total || item.quantity * item.unitPrice), quotation.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 border rounded-lg p-4">
                {(() => {
                  const { currency, subtotal, discount, vatRate, vat, total, discountPct } =
                    calcTotalsWithVat(quotation);
                  const money = (n) =>
                    `${currency} ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
                  return (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">{money(subtotal)}</span>
                      </div>

                      {discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Discount{discountPct ? ` (${discountPct}%)` : ""}
                          </span>
                          <span className="text-gray-900">- {money(discount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-600">VAT ({Math.round(vatRate * 100)}%)</span>
                        <span className="text-gray-900">{money(vat)}</span>
                      </div>

                      <div className="h-px bg-gray-200 my-2" />

                      <div className="flex justify-between text-base font-semibold">
                        <span>Total</span>
                        <span>{money(total)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Terms and Timeline */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Truck size={18} className="mr-2" />
                Delivery & Terms
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Delivery Timeline:</span>
                  <span className="ml-2 font-medium">
                    {quotation.deliveryTimelineDays ? `${quotation.deliveryTimelineDays} days` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Payment Terms:</span>
                  <span className="ml-2 font-medium">{quotation.paymentTerms || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Delivery Terms:</span>
                  <span className="ml-2 font-medium">
                    {quotation.deliveryTerms || quotation.delivery_terms || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Shipping Terms:</span>
                  <span className="ml-2 font-medium">{quotation.shippingTerms || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Valid For:</span>
                  <span className="ml-2 font-medium">
                    {quotation.validityDays ? `${quotation.validityDays} days` : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar size={18} className="mr-2" />
                Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 font-medium">{formatDate(createdAt)}</span>
                </div>
                {(quotation.submittedAt || quotation.submitted_at) && (
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <span className="ml-2 font-medium">{formatDate(quotation.submittedAt || quotation.submitted_at)}</span>
                  </div>
                )}
                {derivedExpiry && (
                  <div>
                    <span className="text-gray-600">Expires:</span>
                    <span className="ml-2 font-medium">{formatDate(derivedExpiry)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText size={18} className="mr-2" />
                Notes
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
