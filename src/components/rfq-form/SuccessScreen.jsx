// src/components/rfq-form/SuccessScreen.jsx
//src/components/rfq-form/SuccessScreen.jsx
import React from "react";
import { CheckCircle, Copy, Package } from "lucide-react";

export default function SuccessScreen({ rfqId }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Request Submitted Successfully!</h2>
        <p className="text-gray-600">Your RFQ has been published and suppliers will start responding soon.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="font-medium mb-2">RFQ Details</h3>
        <p className="text-sm text-gray-600 mb-4">
          Reference: <span className="font-mono">{rfqId}</span>
        </p>
        <div className="flex justify-center space-x-4">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Package className="h-4 w-4 mr-2" />
            Invite Suppliers
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <button className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
          Create Another RFQ
        </button>
        <button className="w-full py-3 px-6 border border-gray-300 rounded-lg hover:bg-gray-50">
          View Dashboard
        </button>
      </div>
    </div>
  );
}
