// src/components/SellerDashboardPreview.jsx
//src/components/SellerDashboardPreview.jsx
import React from "react";
import SellerRFQsInline from "./SellerRFQsInline.jsx";
import SellerQuotationsTab from "./SellerQuotationsTab.jsx";

export default function SellerDashboardPreview({ activeTab }) {
  // This is a preview version of the seller dashboard
  // We can modify this component to test new UI designs
  // without affecting the main seller dashboard
  
  if (activeTab === "dashboard") {
    return (
      <div className="space-y-4">
        {/* Preview Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                UI Preview Mode
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>This is a preview of the new seller dashboard design. Changes here won't affect the main application.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Preview Content - Start with current implementation */}
        <SellerRFQsInline />
      </div>
    );
  }
  
  if (activeTab === "create") {
    return (
      <div className="space-y-4">
        {/* Preview Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                UI Preview Mode
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>This is a preview of the new seller quotations design. Changes here won't affect the main application.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Preview Content - Start with current implementation */}
        <SellerQuotationsTab />
      </div>
    );
  }
  
  return null;
}
