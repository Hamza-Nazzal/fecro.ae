import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react";

const FALLBACK_CATEGORIES = [
  "Office Supplies → Paper → A4",
  "Office Supplies → Chairs → Task Chair",
  "Electronics → Computers → Laptops",
  "Electronics → Displays → Monitors",
  "Construction → Fasteners → Screws",
  "Furniture → Seating → Office Chair",
  "Furniture → Tables → Desks",
];

function BreadcrumbLine({ value }) {
  if (!value) return null;
  const parts = value.split(/→|>/).map(s => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className="rfq-breadcrumb mt-1" title={value}>
      {parts.slice(0, -1).map((p, i) => (
        <span key={p + i}>{p} &nbsp;→&nbsp; </span>
      ))}
      <span className="last">{parts[parts.length - 1]}</span>
    </div>
  );
}

export default function BasicsSection({
  currentItem,
  updateCurrentItem,
  commitCategory,
  basicsExpanded,
  setBasicsExpanded,
  isBasicsValid,
}) {
  const [query, setQuery] = useState(currentItem.category || "");
  const [openList, setOpenList] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    setQuery(currentItem.category || "");
  }, [currentItem.category]);

  const options = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return FALLBACK_CATEGORIES.slice(0, 6);
    return FALLBACK_CATEGORIES.filter((o) => o.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const pickCategory = (val) => {
    commitCategory(val);
    setQuery(val);
    setOpenList(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const exact = options.find((o) => o.toLowerCase() === query.toLowerCase().trim());
      if (exact) pickCategory(exact);
    }
    if (e.key === "Escape") setOpenList(false);
  };

  const basicsReady = isBasicsValid();
  const qtyText = currentItem.quantity ? `Qty: ${currentItem.quantity}` : null;

  const CollapsedHeader = (
   <button
    type="button"
    onClick={() => setBasicsExpanded(true)}
    className={`relative rfq-card rfq-focusable w-full text-left p-4 ${
      !basicsExpanded ? "rfq-card--tinted" : ""
    }`}
    aria-label="Edit product basics"
  >
      {!basicsReady && <span className="rfq-left-strip" />}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="rfq-title truncate">
              {currentItem.productName?.trim() || "Untitled item"}
            </div>
            <span className={`pill ${basicsReady ? "open" : "closed"}`}>
              {basicsReady ? "Basics complete" : "Basics incomplete"}
            </span>
            {qtyText && <span className="rfq-meta">{qtyText}</span>}
          </div>

          <BreadcrumbLine value={currentItem.category} />
        </div>

        <ChevronDown 
         className="h-4 w-4 shrink-0 mt-1"
          style={{ color: "var(--hint)" }} />
      </div>
    </button>
  );

  const ExpandableHeader = (
    <button
      type="button"
      className="rfq-card rfq-focusable w-full p-4 flex items-center justify-between"
      onClick={() => setBasicsExpanded(false)}
      aria-expanded={true}
    >
      <div className="flex items-center">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
            basicsReady ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {basicsReady ? <Check className="h-4 w-4" /> : "A"}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Product Basics</h3>
          <p className="text-sm text-gray-600">Add product name & select a category.</p>
        </div>
      </div>
      <ChevronUp className="h-4 w-4 text-[var(--hint)]" />
    </button>
  );

  return (
    <div className="mb-6">
      {basicsExpanded ? ExpandableHeader : CollapsedHeader}

      {basicsExpanded && (
        <div className="mt-4 space-y-4 p-4 rfq-card">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                currentItem.productName.trim().length >= 2 ? "border-green-300 bg-green-50" : "border-gray-300"
              }`}
              placeholder="e.g., A4, office chair, laptop…"
              value={currentItem.productName}
              onChange={(e) => updateCurrentItem({ productName: e.target.value })}
            />
            {currentItem.productName && currentItem.productName.trim().length < 2 && (
              <p className="text-xs text-red-600 mt-1">Min 2 characters</p>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <div className="relative">
              <input
                type="text"
                className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                  currentItem.categoryCommitted ? "border-green-300 bg-green-50" : "border-gray-300"
                }`}
                placeholder="Start typing to search categories…"
                value={query}
                onFocus={() => setOpenList(true)}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                aria-expanded={openList}
                aria-haspopup="listbox"
              />
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
            </div>

            {openList && options.length > 0 && (
              <div
                ref={listRef}
                role="listbox"
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-sm max-h-56 overflow-auto"
              >
                {options.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => pickCategory(opt)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50"
                    role="option"
                  >
                    {opt}
                  </button>
                ))}
                <div className="px-3 py-2 text-xs text-gray-500 border-t">
                  Select a category from the list to continue.
                </div>
              </div>
            )}

            {!currentItem.categoryCommitted && (
              <p className="text-xs text-red-600 mt-1">Please select a category from the list.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Barcode (optional)</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Scan or enter barcode"
              value={currentItem.barcode}
              onChange={(e) => updateCurrentItem({ barcode: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
