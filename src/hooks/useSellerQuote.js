// src/hooks/useSellerQuote.js
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { computeQuoteTotals } from "../utils/quoteTotals";

// RFQ reads you already export
import { getRFQById, getRFQ } from "../services/rfqService/reads";

// Quotation services you already export
import {
  listQuotationsForRFQ,
  createQuotation,
  updateQuotation,
} from "../services/quotationsService";

// Robust item helpers you added
import { getRfqItems, getCategoryPath, getItemId } from "./useRfqItems";

const DEFAULT_VALIDITY = 7;
const DEFAULT_TAX = 5;

/** Minimal UI -> DB mapper (kept tiny on purpose) */
function uiItemsToDbLineItems(items) {
  return (items || []).map((it) => ({
    rfq_item_id: it.rfqItemId ?? it.rfq_item_id ?? it.item_id ?? null,
    unit_price: Number(it.unitPrice) || 0,
    qty_offer: Number(it.qtyOffer) || 0,
    unit: it.unit || "piece",
    discount_type: it.discountType || null,
    discount_value:
      it.discountValue != null ? Number(it.discountValue) : null,
    warranty_months:
      it.warrantyMonths != null ? Number(it.warrantyMonths) : null,
  }));
}

/** Minimal DB -> UI mapper */
function dbLineItemsToUi(list) {
  const arr =
    Array.isArray(list) ? list : typeof list === "string" ? safeParse(list) : [];
  return arr.map((li) => ({
    rfqItemId: li.rfq_item_id ?? li.rfqItemId ?? null,
    unitPrice: li.unit_price ?? li.unitPrice ?? 0,
    unit: li.unit || "piece",
    qtyOffer: li.qty_offer ?? li.qtyOffer ?? 0,
    discountType: li.discount_type ?? null,
    discountValue: li.discount_value ?? null,
    warrantyMonths: li.warranty_months ?? null,
    _ackSpecs: new Set(),
  }));
}
function safeParse(s) {
  try { return JSON.parse(s); } catch { return []; }
}

export default function useSellerQuote(rfqId) {
  const { user } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [lastSavedAt, setLastSavedAt] = React.useState(null);
  const [rfq, setRfq] = React.useState(null);

  const [header, setHeader] = React.useState({
    id: null,
    rfqId,
    status: "draft",
    currency: "AED",
    paymentTerms: "",
    deliveryIncoterm: "",
    deliveryDays: 0,
    validityDays: DEFAULT_VALIDITY,
    internalReference: "",
    overallDiscount: 0,
    taxPercent: DEFAULT_TAX,
  });

  const [items, setItems] = React.useState([]);

  const totals = React.useMemo(
    () =>
      computeQuoteTotals({
        items,
        overallDiscount: +header.overallDiscount || 0,
        taxPercent: +header.taxPercent || 0,
      }),
    [items, header.overallDiscount, header.taxPercent]
  );

  // Load RFQ + draft (compact & defensive)
  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // 1) RFQ header; fallback to hydrated if header-only
        let rfqSnap = await getRFQById(rfqId);
        let itemsFromHeader = getRfqItems(rfqSnap);

        if (itemsFromHeader.length === 0) {
          try {
            const hydrated = await getRFQ(rfqId);
            if (hydrated) {
              rfqSnap = hydrated;
              itemsFromHeader = getRfqItems(hydrated);
            }
          } catch {}
        }

        // TEMP DEBUG: confirm shape & item count
        console.debug("RFQ keys:", rfqSnap && Object.keys(rfqSnap));
        console.debug("Items found by extractor:", itemsFromHeader.length);

        setRfq(rfqSnap);

        // 2) My draft (from list)
        const list = await listQuotationsForRFQ(rfqId);
        const draft =
          Array.isArray(list)
            ? list
                .filter((q) => q.sellerId === user?.id)
                .find((q) => (q.status || "draft") === "draft") || null
            : null;

        if (!alive) return;
        setRfq(rfqSnap);

        if (draft) {
  setHeader((h) => ({
    ...h,
    id: draft.id ?? null,
    status: draft.status ?? "draft",
    currency: draft.currency ?? "AED",
    paymentTerms: draft.paymentTerms ?? "",
    deliveryIncoterm: draft.deliveryIncoterm ?? draft.shippingTerms ?? "",
    deliveryDays: draft.deliveryDays ?? draft.delivery_timeline_days ?? 0,
    validityDays: draft.validityDays ?? DEFAULT_VALIDITY,
    internalReference: draft.internalReference ?? "",
    overallDiscount: draft.overallDiscount ?? 0,
    taxPercent: DEFAULT_TAX,
  }));

  // Try to read items from the draft first
  const raw = draft.items ?? draft.line_items;
  const fromDraft = dbLineItemsToUi(raw);

  // TEMP DEBUG
  console.debug("Draft present:", !!draft);
  console.debug("Draft items length:", fromDraft.length);

  if (fromDraft.length > 0) {
    setItems(fromDraft);
  } else {
    // ⚠️ Draft exists but has NO items — seed from RFQ instead
    const rfqItems = getRfqItems(rfqSnap);
    console.debug("Seeding from RFQ (count):", rfqItems.length);
    setItems(
      rfqItems.map((it) => ({
        rfqItemId: getItemId(it),
        unitPrice: 0,
        unit: "piece",
        qtyOffer: it.quantity ?? it.qty ?? 1,
        discountType: null,
        discountValue: 0,
        warrantyMonths: 0,
        _ackSpecs: new Set(),
        _categoryPath: getCategoryPath(it),
        _specs:
          it.specs ||
          (it.specs_map
            ? Object.entries(it.specs_map).map(([k, v]) => ({
                key_label: k,
                value: v,
              }))
            : []),
      }))
    );
  }
                } else {
                // No draft at all — seed from RFQ (unchanged)
                const rfqItems = getRfqItems(rfqSnap);
                console.debug("No draft; seeding from RFQ (count):", rfqItems.length);
                setItems(
                    rfqItems.map((it) => ({
                    rfqItemId: getItemId(it),
                    unitPrice: 0,
                    unit: "piece",
                    qtyOffer: it.quantity ?? it.qty ?? 1,
                    discountType: null,
                    discountValue: 0,
                    warrantyMonths: 0,
                    _ackSpecs: new Set(),
                    _categoryPath: getCategoryPath(it),
                    _specs:
                        it.specs ||
                        (it.specs_map
                        ? Object.entries(it.specs_map).map(([k, v]) => ({
                            key_label: k,
                            value: v,
                            }))
                        : []),
                    }))
                );
                }
                    } finally {
                        if (alive) setLoading(false);
                    }
                    })();
                    return () => {
                    alive = false;
                    };
                }, [rfqId, user?.id]);

                const onChangeItem = React.useCallback((idx, patch) => {
                    setItems((arr) => {
                    const next = [...arr];
                    next[idx] = { ...next[idx], ...patch };
                    return next;
                    });
                }, []);

                // Explicit saves only (no autosave loop)
                const saveDraft = React.useCallback(async () => {
                    const patch = {
                    rfq_id: header.rfqId,
                    status: "draft",
                    currency: header.currency,
                    payment_terms: header.paymentTerms || null,
                    shipping_terms: header.deliveryIncoterm || null,
                    delivery_timeline_days: Number(header.deliveryDays) || 0,
                    validity_days: Number(header.validityDays) || DEFAULT_VALIDITY,
                    internal_reference: header.internalReference || null,
                    total_price: totals.grandTotal,
                    line_items: uiItemsToDbLineItems(items),
                    };
                    if (!header.id) {
                    const created = await createQuotation(patch);
                    const newId = created?.id || created?.quotationId || created;
                    if (newId) setHeader((h) => ({ ...h, id: newId }));
                    } else {
                    await updateQuotation(header.id, patch);
                    }
                    setLastSavedAt(new Date());
                }, [header, items, totals.grandTotal]);

                const submit = React.useCallback(async () => {
                    if (!header.id) {
                    await saveDraft();
                    if (!header.id) return;
                    }
                    await updateQuotation(header.id, { status: "submitted" });
                    setLastSavedAt(new Date());
                }, [header.id, saveDraft]);

                return {
                    rfq,
                    header,
                    items,
                    totals,
                    loading,
                    lastSavedAt,
                    setHeader,
                    setItems,
                    onChangeItem,
                    saveDraft,
                    submit,
                };
                }