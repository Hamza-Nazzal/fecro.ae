// src/components/rfq-form/MobileCartSheet.jsx
//src/components/rfq-form/MobileCartSheet.jsx
import React from "react";
import { Package, X } from "lucide-react";

export default function MobileCartSheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-96 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white border border-gray-200 rounded-t-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Items
            </h3>
            <button onClick={onClose}>
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
