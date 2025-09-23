//src/components/rfq-form/OrderDetailsForm.jsx
import React from "react";

export default function OrderDetailsForm({ orderDetails, updateOrderDetails }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Order & Delivery Details</h2>
        <p className="text-gray-600">Final details to complete your request.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Delivery Timeline</label>
          <div className="space-y-3">
            {[
              { value: "asap", label: "ASAP", desc: "Rush delivery if possible" },
              { value: "standard", label: "Standard", desc: "Normal delivery timeline" },
              { value: "custom", label: "Specific Date", desc: null },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="delivery"
                  value={opt.value}
                  checked={orderDetails.deliveryTimeline === opt.value}
                  onChange={(e) => updateOrderDetails({ deliveryTimeline: e.target.value })}
                  className="mr-3"
                />
                <div className="flex-1">
                  <span className="font-medium">{opt.label}</span>
                  {opt.desc && <p className="text-sm text-gray-500">{opt.desc}</p>}
                  {opt.value === "custom" && orderDetails.deliveryTimeline === "custom" && (
                    <input
                      type="date"
                      className="mt-2 p-2 border border-gray-300 rounded text-sm w-full"
                      value={orderDetails.customDate}
                      onChange={(e) => updateOrderDetails({ customDate: e.target.value })}
                    />
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Incoterms</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={orderDetails.incoterms}
              onChange={(e) => updateOrderDetails({ incoterms: e.target.value })}
            >
              <option value="EXW">EXW - Ex Works</option>
              <option value="FOB">FOB - Free on Board</option>
              <option value="CIF">CIF - Cost, Insurance & Freight</option>
              <option value="DDP">DDP - Delivered Duty Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={orderDetails.paymentTerms}
              onChange={(e) => updateOrderDetails({ paymentTerms: e.target.value })}
            >
              <option value="net-15">Net 15</option>
              <option value="net-30">Net 30</option>
              <option value="net-45">Net 45</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">RFQ Validity</label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={orderDetails.quoteDeadline}
            onChange={(e) => updateOrderDetails({ quoteDeadline: e.target.value })}
            required
          >
            <option value="">Select validity</option>
            <option value="7-days">7 days</option>
            <option value="14-days">14 days</option>
            <option value="1-month">1 month</option>
            <option value="+1month">+1month</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Internal Reference Number (Optional)</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            placeholder="Project number, PO, or internal reference"
            value={orderDetails.internalRef}
            onChange={(e) => updateOrderDetails({ internalRef: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
