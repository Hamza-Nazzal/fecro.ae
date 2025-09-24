// src/components/QuotationViewer.jsx
//src/components/QuotationViewer.jsx
import React from "react";
import { X, Calendar, Package, Truck, FileText } from "lucide-react";

export default function QuotationViewer({ quotation, onClose }) {
  if (!quotation) return null;

  const formatCurrency = (amount, currency = "AED") => {
    const numAmount = Number(amount) || 0;
    return `${currency} ${numAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              {quotation.rfq?.sellerIdDisplay || "—"}
            </p>
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
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(quotation.totalPrice, quotation.currency)}
              </div>
              <div className="text-sm text-gray-500">Total Price</div>
            </div>
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
                        <td className="px-4 py-3 text-sm text-gray-900">{item.item}</td>
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
                  <span className="ml-2 font-medium">{formatDate(quotation.createdAt)}</span>
                </div>
                {quotation.submittedAt && (
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <span className="ml-2 font-medium">{formatDate(quotation.submittedAt)}</span>
                  </div>
                )}
                {quotation.expiresAt && (
                  <div>
                    <span className="text-gray-600">Expires:</span>
                    <span className="ml-2 font-medium">{formatDate(quotation.expiresAt)}</span>
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
