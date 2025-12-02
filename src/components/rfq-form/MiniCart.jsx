// src/components/rfq-form/MiniCart.jsx
//src/components/rfq-form/MiniCart.jsx
import React, { useState } from "react";
import { Copy, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export default function MiniCart({ items, onEdit, onDuplicate, onRemove }) {
  const [expanded, setExpanded] = useState(null);

  if (!items?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">Items you add will appear here</p>
      </div>
    );
    }

  const isDraft = (it) => {
    const nameOk = (it.productName || "").trim().length >= 3;
    const catOk = (it.category || "").trim().length > 0;
    const qtyOk = Number(it.quantity) > 0;
    return !(nameOk && catOk && qtyOk);
  };

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const open = expanded === item.id;
        const draft = isDraft(item);

        return (
          <div key={item.id} className="border border-gray-100 rounded-lg">
            <div className="p-3">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">{item.productName || "Untitled item"}</h4>
                    {draft && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    Qty {item.quantity || "—"} •{" "}
                    {Object.values(item.specifications || {}).filter(
                      (spec) => (spec?.value ?? "").toString().trim()
                    ).length} specs
                  </p>
                </div>

                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button onClick={() => onEdit(item.id)} className="text-blue-600 hover:text-blue-800" title="Edit">
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onDuplicate(item.id)}
                    disabled={items.length >= 50}
                    className={items.length >= 50 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:text-gray-800"}
                    title={items.length >= 50 ? "Maximum of 50 items allowed per RFQ" : "Duplicate"}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={() => onRemove(item.id)} className="text-red-600 hover:text-red-800" title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setExpanded(open ? null : item.id)}
                    className="text-gray-600 hover:text-gray-800 ml-1"
                    title={open ? "Collapse" : "Expand"}
                  >
                    {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>

            {open && (
              <div className="px-3 pb-3 text-xs text-gray-700">
                {item.category && <div className="mb-1"><span className="text-gray-500">Category:</span> {item.category}</div>}
                {item.barcode && <div className="mb-1"><span className="text-gray-500">Barcode:</span> {item.barcode}</div>}
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(item.specifications || {})
                    .filter(([, spec]) => (spec?.value ?? "").toString().trim())
                    .map(([keyNorm, spec]) => {
                      const label = spec?.key_label || keyNorm;
                      const value = (spec?.value ?? "").toString().trim();
                      const unit = (spec?.unit ?? "").toString().trim();
                      const display = unit ? `${value} ${unit}`.trim() : value;
                      return (
                        <span key={keyNorm} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          {label}: {display}
                        </span>
                      );
                    })}
                  {Object.keys(item.specifications || {}).length === 0 && (
                    <span className="text-gray-500">No specs added</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
