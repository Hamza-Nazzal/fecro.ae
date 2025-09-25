// src/components/QuotationModal.jsx
//src/components/QuotationModal.jsx
import React from "react";
import { X } from "lucide-react";

// Helper function to anonymize company names
const anonymizeCompany = (companyName) => {
  const words = String(companyName || "").split(" ");
  const firstTwo = words.slice(0, 2);
  return firstTwo.map((w) => (w[0] ? w[0].toUpperCase() + "***" : "")).join(" ");
};

export default function QuotationModal({ 
  selectedRequest, 
  quotation, 
  setQuotation, 
  onClose, 
  onSendQuotation 
}) {
  if (!selectedRequest) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-0 z-50 sm:items-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Send Quotation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="mb-4">
          <p className="text-gray-600 mb-2 text-sm">{selectedRequest.title}</p>
          <p className="text-xs text-gray-500">Requested by: {anonymizeCompany(selectedRequest.company)}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Price</label>
            <input
              type="text"
              value={quotation.price}
              onChange={(e) => setQuotation({ ...quotation, price: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              placeholder="$1,200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={quotation.description}
              onChange={(e) => setQuotation({ ...quotation, description: e.target.value })}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              placeholder="Product details, terms, etc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Timeline</label>
            <input
              type="text"
              value={quotation.delivery}
              onChange={(e) => setQuotation({ ...quotation, delivery: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              placeholder="5-7 business days"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-base"
          >
            Cancel
          </button>
          <button
            onClick={onSendQuotation}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-base"
          >
            Send Quote
          </button>
        </div>
      </div>
    </div>
  );
}