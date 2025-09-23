//src/components/rfq-form/ReviewPanel.jsx
import React from "react";
import { ChevronDown, ChevronUp, Edit } from "lucide-react";

export default function ReviewPanel({
  items,
  orderDetails,
  onEditItem,
  showSupplierPreview,
  setShowSupplierPreview,
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Request</h2>
        <p className="text-gray-600">You can submit now or refine specs—both are fine.</p>
      </div>

      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg">
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium">{item.productName}</h3>
                <p className="text-sm text-gray-600">
                  {item.category} • Qty: {item.quantity}
                </p>
                <div className="flex space-x-2 mt-2">
                  {Object.entries(item.specifications || {})
                    .filter(([, v]) => v)
                    .slice(0, 3)
                    .map(([k, v]) => (
                      <span key={k} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {k}: {v}
                      </span>
                    ))}
                </div>
              </div>
              <button onClick={() => onEditItem(item.id)} className="text-blue-600 hover:text-blue-800" title="Edit">
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium mb-3">Order Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery:</span>
            <span>
              {orderDetails.deliveryTimeline === "custom"
                ? `Specific: ${orderDetails.customDate || "—"}`
                : orderDetails.deliveryTimeline === "asap"
                ? "ASAP"
                : "Standard"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Incoterms:</span>
            <span>{orderDetails.incoterms}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment:</span>
            <span>{orderDetails.paymentTerms}</span>
          </div>
          {orderDetails.internalRef && (
            <div className="flex justify-between">
              <span className="text-gray-600">Internal Ref:</span>
              <span>{orderDetails.internalRef}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowSupplierPreview(!showSupplierPreview)}
          className="w-full p-3 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex justify-between items-center"
        >
          <span className="font-medium">What suppliers will see</span>
          {showSupplierPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showSupplierPreview && (
          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">RFQ Preview</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Items:</strong> {items.length} products
              </p>
              <p>
                <strong>Deadline:</strong> {orderDetails.quoteDeadline || "Not specified"}
              </p>
              <p>
                <strong>Delivery:</strong> {orderDetails.deliveryTimeline}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
