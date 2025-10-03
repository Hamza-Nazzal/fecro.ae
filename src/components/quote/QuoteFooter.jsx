// src/components/quote/QuoteFooter.jsx
import React from "react";

export default function QuoteFooter({ lastSavedAt, onPreview, onSaveDraft, onSubmit }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white/90 backdrop-blur">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-3">
        <div className="text-sm text-gray-500">
          {lastSavedAt ? `Saved • ${lastSavedAt.toLocaleTimeString()}` : "—"}
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={onPreview}>
            Preview PDF
          </button>
          <button className="px-3 py-2 border rounded" onClick={onSaveDraft}>
            Save Draft
          </button>
          <button className="px-3 py-2 bg-black text-white rounded" onClick={onSubmit}>
            Submit quote
          </button>
        </div>
      </div>
    </div>
  );
}