// src/components/rfq-form/OrderDetailsForm.jsx
import React from "react";
import { RequiredLabel, FieldError } from "./form/RequiredBits";

export default function OrderDetailsForm({ orderDetails, updateOrderDetails }) {
  // Error state for deadline
  const dlMissing = !orderDetails?.quoteDeadline;
  const dlError =
    orderDetails?._touchedDeadline && dlMissing
      ? "Quote deadline is required"
      : "";
  const shouldBlink = dlMissing && orderDetails?._touchedDeadline;

  // Date constraints for delivery calendar
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const maxDate = new Date(today);
  maxDate.setMonth(today.getMonth() + 6);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const maxDateStr = maxDate.toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Order &amp; Delivery Details
        </h2>
        <p className="text-gray-600">
          Final details to complete your request.
        </p>
      </div>

      <div className="space-y-6">
        {/* NEW: Delivery Location (optional, feeds ReviewStep via orderDetails.location) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Location (optional)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="City"
              value={orderDetails?.location?.city || ""}
              onChange={(e) =>
                updateOrderDetails({
                  location: {
                    ...(orderDetails?.location || {}),
                    city: e.target.value,
                  },
                })
              }
            />
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="State / Emirate"
              value={orderDetails?.location?.state || ""}
              onChange={(e) =>
                updateOrderDetails({
                  location: {
                    ...(orderDetails?.location || {}),
                    state: e.target.value,
                  },
                })
              }
            />
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Country"
              value={orderDetails?.location?.country || ""}
              onChange={(e) =>
                updateOrderDetails({
                  location: {
                    ...(orderDetails?.location || {}),
                    country: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Delivery Timeline
          </label>
          <div className="space-y-3">
            {[
              {
                value: "asap",
                label: "ASAP",
                desc: "Rush delivery if possible",
              },
              {
                value: "standard",
                label: "Standard",
                desc: "Normal delivery timeline",
              },
              { value: "custom", label: "Specific Date", desc: null },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="delivery"
                  value={opt.value}
                  checked={orderDetails.deliveryTimeline === opt.value}
                  onChange={(e) =>
                    updateOrderDetails({ deliveryTimeline: e.target.value })
                  }
                  className="mr-3"
                />
                <div className="flex-1">
                  <span className="font-medium">{opt.label}</span>
                  {opt.desc && (
                    <p className="text-sm text-gray-500">{opt.desc}</p>
                  )}
                  {opt.value === "custom" &&
                    orderDetails.deliveryTimeline === "custom" && (
                      <input
                        type="date"
                        className="mt-2 p-2 border border-gray-300 rounded text-sm w-full"
                        value={orderDetails.customDate || tomorrowStr}
                        onChange={(e) =>
                          updateOrderDetails({ customDate: e.target.value })
                        }
                        min={tomorrowStr}
                        max={maxDateStr}
                      />
                    )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Terms
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={orderDetails.incoterms || "CP"}
              onChange={(e) =>
                updateOrderDetails({ incoterms: e.target.value })
              }
            >
              <option value="CP">Customer Pickup</option>
              <option value="SD">Supplier Delivery</option>
              <option value="CPC">Customer Pays Courier</option>
              <option value="SPC">Supplier Pays Courier</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Terms
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={orderDetails.paymentTerms || "DUR"}
              defaultValue="DUR"
              onChange={(e) =>
                updateOrderDetails({ paymentTerms: e.target.value })
              }
            >
              <option value="PIA">Payment In Advance</option>
              <option value="DUR">Due On Receipt</option>
              <option value="net-15">Net 15 Days</option>
              <option value="net-30">Net 30 Days</option>
              <option value="net-60">Net 60 Days</option>
              <option value="net-90">Net 90 Days</option>
            </select>
          </div>
        </div>

        <div>
          <RequiredLabel htmlFor="rfq-deadline">
            {" "}
            Request For Quotation is valid for
          </RequiredLabel>
          <select
            id="rfq-deadline"
            className={`w-full p-3 border rounded-lg focus:ring-2 ${
              dlError
                ? `border-red-600 bg-red-50 focus:ring-red-600 ${
                    shouldBlink ? "animate-pulse" : ""
                  }`
                : "border-slate-300 focus:ring-slate-600"
            }`}
            value={orderDetails.quoteDeadline}
            onChange={(e) =>
              updateOrderDetails({ quoteDeadline: e.target.value })
            }
            onBlur={() => updateOrderDetails({ _touchedDeadline: true })}
            required
            aria-required="true"
            aria-invalid={!!dlError}
            aria-describedby={dlError ? "err-deadline" : undefined}
          >
            <option value="">Select validity</option>
            <option value="7-days">7 days</option>
            <option value="14-days">14 days</option>
            <option value="1-month">1 month</option>
            <option value="+1month">+1month</option>
          </select>
          <FieldError id="err-deadline">{dlError}</FieldError>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Internal Reference Number (Optional)
          </label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            placeholder="Project number, PO, or internal reference"
            value={orderDetails.internalRef}
            onChange={(e) =>
              updateOrderDetails({ internalRef: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  );
}