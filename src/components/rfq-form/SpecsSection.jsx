// src/components/rfq-form/SpecsSection.jsx
import React from "react";
import { Check, ChevronDown, ChevronUp, Package, Plus, X } from "lucide-react";
import { joinValueUnit, splitValueUnit, makeKeyPair, normalizeKey } from "../../utils/rfq/rfqSpecs";
import { FieldError } from "./form/RequiredBits";
export default function SpecsSection({
  currentItem,
  updateCurrentItem,
  specsExpanded,
  setSpecsExpanded,
  recommended = [],
  canSaveItem,
  onSaveItem,
  onOpenVariantMatrix,
}) {
  const specs = currentItem.specifications || {};
  
  // Compute filledCount for specs validation
  const filledCount = Object.values(specs).filter((spec) => 
    String(spec?.value ?? "").trim().length > 0
  ).length;

  // Quantity validation
  const qtyMissing = !currentItem.quantity;
  const qtyInvalid = currentItem.quantity && Number(currentItem.quantity) <= 0;
  const qtyError = currentItem._touchedQuantity && (qtyMissing || qtyInvalid) 
    ? (qtyMissing ? "Quantity is required" : "Quantity must be greater than 0")
    : null;
  const shouldBlinkQty = qtyError && currentItem._touchedQuantity;

  const addSpecKey = (label) => {
    const { key_norm, key_label } = makeKeyPair(label);
    if (!key_norm || specs[key_norm]) return;
    updateCurrentItem({
      specifications: {
        ...specs,
        [key_norm]: { key_norm, key_label, value: "", unit: null },
      },
    });
  };
  const removeSpecKey = (keyNorm) => {
    const next = { ...specs };
    delete next[keyNorm];
    updateCurrentItem({ specifications: next });
  };

  const stepQty = (delta) => {
    const n = Math.max(1, (parseInt(currentItem.quantity || "0", 10) || 0) + delta);
    updateCurrentItem({ quantity: String(n) });
  };

  return (
    <div className="mb-6">
      <div
        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
        onClick={() => setSpecsExpanded(!specsExpanded)}
        aria-expanded={specsExpanded}
      >
        <div className="flex items-center">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
              canSaveItem() ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
            }`}
          >
            {canSaveItem() ? <Check className="h-4 w-4" /> : "B"}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Specifications & Quantity</h3>
            {!specsExpanded && (
              <p className="text-sm text-gray-600">
                Qty: {currentItem.quantity || "—"} •{" "}
                {Object.values(specs).filter((spec) => (spec?.value ?? "").toString().trim()).length} specs
              </p>
            )}
          </div>
        </div>
        {specsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>

      {specsExpanded && (
        <div className="mt-4 space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Quantity <span className="text-red-600">*</span></label>
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => stepQty(-1)}
                  className="px-3 border border-gray-300 rounded-l-lg hover:bg-gray-100"
                  title="Decrease"
                >
                  –
                </button>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`w-full p-3 border-t border-b border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm ${
                    qtyError
                      ? `border-red-500 bg-red-50 focus:ring-red-500 ${shouldBlinkQty ? "animate-pulse" : ""}`
                      : currentItem.quantity && Number(currentItem.quantity) > 0
                      ? "bg-green-50"
                      : ""
                  }`}
                  placeholder="e.g., 100"
                  value={currentItem.quantity}
                  onChange={(e) => updateCurrentItem({ quantity: e.target.value })}
                  onBlur={() => updateCurrentItem({ _touchedQuantity: true })}
                />
                <button
                  type="button"
                  onClick={() => stepQty(1)}
                  className="px-3 border border-gray-300 rounded-r-lg hover:bg-gray-100"
                  title="Increase"
                >
                  +
                </button>
              </div>
              {qtyError && <p className="text-xs text-red-600 mt-1">{qtyError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "one-time", label: "One-time" },
                  { v: "recurring", label: "Recurring" },
                ].map((opt) => {
                  const active = currentItem.purchaseType === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => updateCurrentItem({ purchaseType: opt.v })}
                      className={[
                        "border rounded-lg px-3 py-2 text-sm text-left",
                        active ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:bg-gray-100",
                      ].join(" ")}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-gray-500">
                        {opt.v === "one-time" ? "Single purchase" : "Repeat orders"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Specifications (optional)</h4>
              {filledCount === 0 && (
                <FieldError id="err-specs">Please add at least one specification.</FieldError>
              )}
              <div className="space-y-3">
                {Object.keys(specs).length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p>No specifications added yet.</p>
                    <p className="text-xs">Click attributes on the right to add them.</p>
                  </div>
                )}
                {Object.entries(specs).map(([keyNorm, spec]) => {
                  const label = spec?.key_label || keyNorm;
                  const composite = joinValueUnit(spec?.value ?? "", spec?.unit ?? null);
                  return (
                    <div key={keyNorm} className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                        {label}
                      </span>
                      <input
                        type="text"
                        className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter value"
                        value={composite}
                        onChange={(e) => {
                          const { value, unit } = splitValueUnit(e.target.value);
                          updateCurrentItem({
                            specifications: {
                              ...specs,
                              [keyNorm]: {
                                key_norm: keyNorm,
                                key_label: label,
                                value,
                                unit,
                              },
                            },
                          });
                        }}
                      />
                      <button className="text-red-500 hover:text-red-700" onClick={() => removeSpecKey(keyNorm)} title="Remove">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recommended Attributes</h4>
              <div className="space-y-2">
                {recommended
                  .filter((s) => !specs[normalizeKey(s)])
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => addSpecKey(s)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="h-4 w-4 inline mr-2 text-blue-600" />
                      {s}
                    </button>
                  ))}
                {recommended.filter((s) => !specs[normalizeKey(s)]).length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Check className="h-4 w-4 inline mr-2 text-green-600" />
                    All recommended attributes added!
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onOpenVariantMatrix}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Create Variants
            </button>
            <button
              onClick={onSaveItem}
              disabled={!canSaveItem()}
              className={`ml-2 px-4 py-2 rounded-lg ${
                canSaveItem() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-500"
              }`}
              title={!canSaveItem() ? "Add name, category, and quantity" : ""}
            >
              Save Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
