// src/components/rfq-form/SuccessScreen.jsx
import React, { useRef } from "react";
import { CheckCircle, Printer, Package } from "lucide-react";
import ReviewStep from "./ReviewStep";

export default function SuccessScreen({ rfqId, rfqPublicId, items = [], orderDetails = {} }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContents = printRef.current;
    if (!printContents) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Write the content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>RFQ ${rfqPublicId || rfqId}</title>
          <meta charset="utf-8">
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              @page { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          ${printContents.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };
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
          Reference: <span className="font-mono font-semibold text-lg">{rfqPublicId || rfqId}</span>
        </p>
        <div className="flex justify-center space-x-4">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Package className="h-4 w-4 mr-2" />
            Invite Suppliers
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print RFQ
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

      {/* Hidden print area */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <ReviewStep
            items={items}
            orderDetails={orderDetails}
            meta={{
              publicId: rfqPublicId || rfqId,
              rfqId: rfqPublicId || rfqId,
              issuedAt: new Date(),
              validDays: 14,
              location: {
                city: "—",
                emirate: "—",
                country: "UAE"
              }
            }}
            groupByCategory={true}
            onEditItem={null}
            onUpdateQuantity={null}
          />
        </div>
      </div>
    </div>
  );
}
