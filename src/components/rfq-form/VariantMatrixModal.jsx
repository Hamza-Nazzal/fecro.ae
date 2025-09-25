// src/components/rfq-form/VariantMatrixModal.jsx
//src/components/rfq-form/VariantMatrixModal.jsx
import React from "react";
import { X } from "lucide-react";

export default function VariantMatrixModal({ open, onClose, onCreate }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Create Variants</h3>
            <button onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Generate multiple variants based on your specifications.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onCreate?.();
                onClose?.();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Variants
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
