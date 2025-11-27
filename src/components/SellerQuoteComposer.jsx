// src/components/SellerQuoteComposer.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// data loaders (existing app logic)
import { useSellerRFQ } from "./quote/useSellerRFQ"; // you already created this file earlier
import useSubmitQuotation from "../hooks/useSubmitQuotation";
import { normalizeLocation } from "../utils/location/normalizeLocation";

// optional: your shared CSS for quote visuals
import "./quote/seller-quote.css";

// shared helpers for item display
import { getItemName, toSpecList } from "../utils/rfq/itemHelpers";

export default function SellerQuoteComposer() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // RFQ + hydrated (seller-safe) data from your hook
  const { rfq, hydrated, loading, hydrating, error, hydrateError } = useSellerRFQ(rfqId, user?.id);



  // TEMP DEBUG: expose RFQ and hydrated to window for console inspection
if (typeof window !== "undefined") {
  window.__rfq = rfq;
  window.__hydrated = hydrated;
}

  // Submit hook (existing business logic)
  const submitHook = useSubmitQuotation({ rfq: rfq || {}, seller: user || {} });
  const { form, setForm, updateLine, totals, submitting, errors, submit } = submitHook;

  // --- spec selection state (safe add) ---
  const [selectedSpecs, setSelectedSpecs] = useState(() => new Set());
  const toggleSpec = (itemId, specIdx) => {
    setSelectedSpecs(prev => {
      const next = new Set(prev);
      const key = `${itemId}-${specIdx}`;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  // --- end spec selection state ---

  // items to render (hydrated preferred)
  const items = useMemo(() => {
    const result = (Array.isArray(hydrated?.items) && hydrated.items.length ? hydrated.items : (rfq?.items || []));
    
    // TEMP debug (REMOVE AFTER AUDIT)
    console.debug('[ITEM-SOURCE]', {
      hydratedLen: Array.isArray(hydrated?.items) ? hydrated.items.length : null,
      rfqLen: Array.isArray(rfq?.items) ? rfq.items.length : null,
      using: (Array.isArray(hydrated?.items) && hydrated.items.length) ? 'hydrated' : 'rfq'
    });
    
    return result;
  }, [hydrated?.items, rfq?.items]);

  // group items by category for the UI
  const groupEntries = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const key = it?.categoryPath || it?.category_path || "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  // derive terms (read-only preview for now)
  // Check hydrated first, then fall back to base RFQ fields
  const terms = {
    payment: hydrated?.orderDetails?.payment ?? rfq?.payment ?? null,
    incoterms: hydrated?.orderDetails?.incoterms ?? hydrated?.orderDetails?.deliveryTerms ?? rfq?.incoterms ?? null,
    delivery: hydrated?.orderDetails?.deliveryTime ?? hydrated?.orderDetails?.deliveryTimelineLabel ?? rfq?.deliveryTime ?? rfq?.delivery ?? "Standard",
  };

  // Seed the submit form from RFQ items (once items are available)
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded) return;
    if (!items.length) return;
    // build initial lines that the hook expects
    const seededLines = items.map((it) => ({
      item: getItemName(it),
      quantity: Number(it?.quantity ?? 0),
      unitPrice: "", // seller fills in
    }));
    setForm((f) => ({ ...f, currency: "AED", lineItems: seededLines }));
    setSeeded(true);
  }, [items, seeded, setForm]);

  // Simple submit handler
  async function handleSubmit(e) {
    e.preventDefault();
    const res = await submit();
    if (res?.ok) {
      // created quotation -> go back to seller dashboard
      navigate("/seller");
    }
    // errors are already exposed via `errors` / returned object
  }

  // ------------ UI ------------
  const title = hydrated?.title || rfq?.title || "Untitled RFQ";
  const sellerRfqId = hydrated?.sellerRfqId ?? rfq?.sellerRfqId ?? null;
  const totalUnits =
    (hydrated?.qtyTotal) ??
    items.reduce((sum, it) => sum + Number(it?.quantity ?? 0), 0);

  // derive location with fallback priority: hydrated.location → rfq.location → rfq.buyer.location → rfq.companyLocation
  const resolvedLocationRaw = 
    hydrated?.location ||
    rfq?.location ||
    rfq?.buyer?.location ||
    rfq?.companyLocation ||
    {};
  
  // Normalize location to ensure canonical shape
  const normalizedLocation = normalizeLocation(resolvedLocationRaw);
  
  const locationDisplay = (() => {
    const parts = [normalizedLocation.city, normalizedLocation.state, normalizedLocation.country].filter(
      (value) => value != null && typeof value === "string" && value.trim().length > 0
    );
    if (parts.length) return parts.join(", ");
    return "—";
  })();

  // ensure a default validity in form (1..60, default 7)
  React.useEffect(() => {
    setForm((f) => {
      if (typeof f?.validityDays === "number") return f;
      return { ...f, validityDays: 7 };
    });
  }, [setForm]);

  return (
    <div className="p-4">
      <div className="mb-3">
        <Link to="/seller" className="text-blue-600 hover:underline text-sm">← Back to Dashboard</Link>
      </div>

      {/* Loading / error states */}
      {loading && (
        <div className="rounded-xl border bg-white p-4">Loading RFQ…</div>
      )}
      {!loading && error && (
        <div className="rounded-xl border bg-white p-4 text-red-600 text-sm">{error}</div>
      )}
      {!loading && !error && (
        <div className="mt-4 font-sans max-w-5xl mx-auto bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-blue-50 border-b-4 border-blue-600">
            <div className="px-6 py-5">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Create Quotation
              </div>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {sellerRfqId && <span className="text-xs text-gray-600">({sellerRfqId})</span>}
              </div>
              {hydrating && <div className="text-xs text-gray-500 mt-1">Loading details…</div>}
              {hydrateError && <div className="text-xs text-red-600 mt-1">{hydrateError}</div>}
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            {/* Overview */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Overview
              </h2>
              <div className="border border-gray-200 bg-white">
                <div className="divide-y divide-gray-200">
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Total Items
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {groupEntries.reduce((n, [, arr]) => n + arr.length, 0)}
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Total Units
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{totalUnits ?? 0}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Company location
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {locationDisplay}
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Quotation Validity (days)
                    </label>
                    <select
                      value={form.validityDays ?? 7}
                      onChange={(e) => setForm((f) => ({ ...f, validityDays: Math.max(1, Math.min(60, Number(e.target.value) || 7)) }))}
                      className="w-40 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 60 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Requested Items (grouped) */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Requested Items
              </h2>

              <div className="space-y-6">
                {(() => {
                  let globalIdx = 0;
                  // Flatten index -> lineItems index for update binding
                  let runningLineIndex = 0;

                  return groupEntries.map(([groupName, groupItems]) => (
                    <div key={groupName}>
                      <div className="bg-gray-50 border-l-4 border-blue-600 px-3 py-2 mb-3">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                          {groupName}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {groupItems.map((it, i) => {
                          globalIdx += 1;
                          
                          // TEMP: spec introspection debug (REMOVE AFTER AUDIT)
                          console.debug('[SPEC-PROBE]', {
                            itemId: it?.id,
                            hasBuyerSpecs: Array.isArray(it?.buyerSpecifications) ? it.buyerSpecifications.length : null,
                            hasSpecificationsArr: Array.isArray(it?.specifications) ? it.specifications.length : null,
                            hasSpecificationsObj: it?.specifications && !Array.isArray(it?.specifications) && typeof it?.specifications === 'object',
                            specsLenAfterToSpecList: Array.isArray(toSpecList(it?.specifications || it?.specs || it?.rfq_item_specs || it?.buyerSpecifications)) 
                              ? toSpecList(it?.specifications || it?.specs || it?.rfq_item_specs || it?.buyerSpecifications).length 
                              : null,
                          });
                          
                          const specs = toSpecList(it?.specifications || it?.specs || it?.rfq_item_specs || it?.buyerSpecifications);
                          const itemId = it?.id ?? `${getItemName(it)}-${i}`;

                          const liIndex = runningLineIndex++; // aligns with seeded lineItems order
                          const li = form.lineItems?.[liIndex] || { item: getItemName(it), quantity: Number(it?.quantity ?? 0), unitPrice: "" };

                          return (
                            <div key={it?.id || `${getItemName(it)}-${i}`} className="border border-gray-200">
                              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                                    Item #{globalIdx}
                                  </span>
                                  <h4 className="text-base font-bold text-gray-900">
                                    {getItemName(it)}
                                  </h4>
                                </div>
                                <div className="bg-green-600 text-white rounded px-2 py-1 text-center">
                                  <div className="text-[10px] font-medium uppercase leading-none">Qty</div>
                                  <div className="text-sm font-bold leading-none">
                                    {Number(it?.quantity ?? 0)}
                                  </div>
                                </div>
                              </div>

                              <div className="px-4 py-3">
                                {specs.length ? (
                                  <div className="mt-2 flex flex-wrap gap-2" role="list" aria-label="Technical specifications">
                                    {specs.slice(0, 12).map((s, idx) => {
                                      const specKey = `${itemId}-${idx}`;
                                      const isSelected = selectedSpecs.has(specKey);
                                      const isFirstSpec = idx === 0;
                                      const hasAnySelected = specs.some((_, sIdx) => selectedSpecs.has(`${itemId}-${sIdx}`));

                                      // text to show inside pill
                                      const label = s?.label ?? s?.key_label ?? s?.key_norm ?? "Spec";
                                      const display = s?.display ?? s?.value ?? "";

                                      return (
                                        <button
                                          key={specKey}
                                          type="button"
                                          onClick={() => toggleSpec(itemId, idx)}
                                          role="listitem"
                                          className={[
                                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer border",
                                            isSelected ? "!bg-blue-700 !text-white !border-blue-600" : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200",
                                            isFirstSpec && !hasAnySelected ? "first-spec-pulse" : ""
                                          ].join(" ")}
                                          aria-pressed={isSelected ? "true" : "false"}
                                        >
                                          <span className="truncate" title={`${label}: ${display}`}>
                                            {label}{display ? `: ${display}` : ""}
                                          </span>
                                          {isSelected ? (
                                            <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          ) : (
                                            <span className="text-gray-500 ml-0.5">+</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 italic mb-4">
                                    No technical specifications provided
                                  </div>
                                )}

                                {/* Pricing inputs bound to the submit hook */}
                                <div className="border-t border-gray-200 pt-3 mt-3">
                                  <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div>
                                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
                                        Unit Price (AED)
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={li.unitPrice ?? ""}
                                        onChange={(e) => updateLine(liIndex, { unitPrice: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
                                        Discount (%)
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={li.discount ?? ""}
                                        onChange={(e) => updateLine(liIndex, { discount: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
                                        Total (AED)
                                      </label>
                                      <div className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded font-semibold text-gray-900">
                                        {(() => {
                                          const qty = Number(li.quantity) || 0;
                                          const up  = Number(li.unitPrice) || 0;
                                          const disc = Number(li.discount) || 0;
                                          const total = qty * up * (1 - disc / 100);
                                          return total.toFixed(2);
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                  {errors?.[`li_${liIndex}_price`] && (
                                    <div className="mt-1 text-xs text-red-600">{errors[`li_${liIndex}_price`]}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Terms (preview from RFQ) */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Commercial Terms
              </h2>
              <div className="border border-gray-200 bg-white">
                <div className="divide-y divide-gray-200">
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Delivery Timeline
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{terms.delivery ?? "—"}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Delivery Terms (Incoterms)
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{terms.incoterms ?? "—"}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Payment Terms
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{terms.payment ?? "—"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Totals + Submit */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Totals
              </h2>
              <div className="max-w-md ml-auto bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                <div className="space-y-3">
                  {errors?.lineItems && (
                    <div className="text-xs text-red-600">{errors.lineItems}</div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                    <span className="text-base font-semibold text-gray-900">AED {totals.totalPrice.toFixed(2)}</span>
                  </div>
                  {/* VAT is automatic on your backend totals if you add later; we keep UI simple for now */}
                </div>

                <div className="mt-4 text-right">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {submitting ? "Submitting…" : "Submit quotation"}
                  </button>
                </div>
              </div>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}