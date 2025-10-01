// src/components/rfq-form/BasicsSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react";
import { RequiredLabel, FieldError } from "./form/RequiredBits";

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

  const markCategoryTouched = () => updateCurrentItem({ _touchedCategory: true });

  const pickCategory = (val) => {
    commitCategory(val);
    setQuery(val);
    setOpenList(false);
    markCategoryTouched();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const exact = options.find((o) => o.toLowerCase() === query.toLowerCase().trim());
      if (exact) pickCategory(exact);
    }
    if (e.key === "Escape") {
      setOpenList(false);
      markCategoryTouched();
    }
  };

  const basicsReady = isBasicsValid();
  const qtyText = currentItem.quantity ? `Qty: ${currentItem.quantity}` : null;

  const productNameValue = currentItem.productName || "";
  const nameTrimmed = productNameValue.trim();
  const nameMissing = nameTrimmed.length === 0;
  const nameTooShort = nameTrimmed.length > 0 && nameTrimmed.length < 2;
  const nameError = currentItem._touchedProductName
    ? nameMissing
      ? "Product name is required"
      : nameTooShort
      ? "Min 2 characters"
      : null
    : null;
  const nameIsValid = nameTrimmed.length >= 2;

  const catMissing =
    !(currentItem.categoryCommitted && (currentItem.category || "").trim());
  const catError =
    currentItem._touchedCategory && catMissing ? "Please select a category from the list." : null;

  const CollapsedHeader = (
   <button
    type="button"
    onClick={() => setBasicsExpanded(true)}
    className={`relative rfq-card rfq-focusable w-full text-left p-4 ${
      !basicsExpanded ? "rfq-card--tinted" : ""
    }`}
    aria-label="Edit product basics"
    aria-expanded={false}
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
            <RequiredLabel htmlFor="rfq-name">Product name</RequiredLabel>
            <input
              id="rfq-name"
              type="text"
              className={`mt-2 w-full p-3 border rounded-lg focus:ring-2 text-base ${
                nameError
                  ? `border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50 ${currentItem._touchedProductName ? "animate-pulse" : ""}`
                  : nameIsValid
                  ? "border-green-300 bg-green-50 focus:ring-blue-500 focus:border-transparent"
                  : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
              }`}
              placeholder="e.g., A4, office chair, laptop…"
              value={productNameValue}
              onChange={(e) => updateCurrentItem({ productName: e.target.value })}
              onBlur={() => updateCurrentItem({ _touchedProductName: true })}
              required
              aria-required="true"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "err-name" : undefined}
            />
            <FieldError id="err-name">{nameError}</FieldError>
          </div>

          <div className="relative">
            <RequiredLabel htmlFor="rfq-cat">Category</RequiredLabel>
            <div className="relative mt-2">
              <input
                id="rfq-cat"
                type="text"
                className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 text-base ${
                  catError
                    ? `border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50 ${currentItem._touchedCategory ? "animate-pulse" : ""}`
                    : !catMissing
                    ? "border-green-300 bg-green-50 focus:ring-blue-500 focus:border-transparent"
                    : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                }`}
                placeholder="Start typing to search categories…"
                value={query}
                onFocus={() => setOpenList(true)}
                onBlur={markCategoryTouched}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                aria-haspopup="listbox"
                required
                aria-required="true"
                aria-invalid={!!catError}
                aria-describedby={catError ? "err-cat" : undefined}
              />
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
            </div>

            {openList && options.length > 0 && (
              <div
                ref={listRef}
                role="listbox"
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-sm max-h-56 overflow-auto"
              >
                {options.map((opt) => {
                  const isSelected = currentItem.category === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => pickCategory(opt)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50"
                      role="option"
                      aria-selected={isSelected}
                    >
                      {opt}
                    </button>
                  );
                })}
                <div className="px-3 py-2 text-xs text-gray-500 border-t">
                  Select a category from the list to continue.
                </div>
              </div>
            )}

            <FieldError id="err-cat">{catError}</FieldError>
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
