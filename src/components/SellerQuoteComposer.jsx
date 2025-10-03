// src/components/SellerQuoteComposer.jsx
import React from "react";
import "./quote/seller-quote.css";
import { useParams } from "react-router-dom";

import QuoteHeader from "./quote/QuoteHeader";
import CategoryGroup from "./quote/CategoryGroup";
import QuoteTerms from "./quote/QuoteTerms";
import QuoteTotals from "./quote/QuoteTotals";

import { computeQuoteTotals } from "../utils/quoteTotals";
import { useAuth } from "../contexts/AuthContext";

// services you actually have
import { getRFQById, getRFQ } from "../services/rfqService/reads";
import {
  listQuotationsForRFQ,
  createQuotation,
  updateQuotation,
} from "../services/quotationsService";

const DEFAULT_VALIDITY = 7;
const DEFAULT_TAX = 5;

/* ---------- Helpers to read various RFQ shapes ---------- */
function getRfqItems(r) {
  if (!r) return [];
  if (Array.isArray(r.items) && r.items.length) return r.items;
  if (Array.isArray(r.rfq_items) && r.rfq_items.length) return r.rfq_items;
  if (Array.isArray(r.data?.items)) return r.data.items;
  if (Array.isArray(r.payload?.items)) return r.payload.items;
  if (Array.isArray(r.categories)) {
    const flat = r.categories.flatMap(c =>
      Array.isArray(c.items) ? c.items.map(it => ({ ...it, _category_from_group: c.name || c.title })) : []
    );
    if (flat.length) return flat;
  }
  if (Array.isArray(r.items_by_category)) {
    const flat = r.items_by_category.flatMap(g =>
      Array.isArray(g.items) ? g.items.map(it => ({ ...it, _category_from_group: g.path || g.name })) : []
    );
    if (flat.length) return flat;
  }
  return [];
}
function getCategoryPath(it) {
  return (
    it.categoryPath ||
    it.category_breadcrumb ||
    it._category_from_group ||
    [it.category_level1, it.category_level2, it.category_level3].filter(Boolean).join(" → ") ||
    "Uncategorized"
  );
}
function getItemId(it) {
  return it.id ?? it.rfq_item_id ?? it.item_id;
}

/* ---------- Map UI quote items -> DB line_items JSON ---------- */
function uiItemsToDbLineItems(items) {
  // Keep the DB-friendly keys you showed in table samples
  return items.map(it => ({
    rfq_item_id: it.rfqItemId ?? it.rfq_item_id ?? it.item_id ?? null,
    unit_price: Number(it.unitPrice) || 0,
    qty_offer: Number(it.qtyOffer) || 0,
    unit: it.unit || "piece",
    // optional discount fields (store if present; harmless if missing in DB)
    discount_type: it.discountType || null,
    discount_value: it.discountValue != null ? Number(it.discountValue) : null,
    warranty_months: it.warrantyMonths != null ? Number(it.warrantyMonths) : null,
  }));
}

export default function SellerQuoteComposer() {
  const { rfqId } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [autosaveAt, setAutosaveAt] = React.useState(null);
  const [rfq, setRfq] = React.useState(null);

  // Header state
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
    overallDiscount: 0,     // amount (applied at totals)
    taxPercent: DEFAULT_TAX // UI only (DB stores total_price)
  });

  // Items state
  const [items, setItems] = React.useState([]);

  /* ---------- Load RFQ + find my draft ---------- */
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        // 1) RFQ header-fast
        let rfqSnap = await getRFQById(rfqId);
        // 2) If no items, try hydrated
        if (getRfqItems(rfqSnap).length === 0) {
          try {
            const hydrated = await getRFQ(rfqId);
            if (hydrated) rfqSnap = hydrated;
          } catch {
            /* ignore */
          }
        }

        // 3) Find my draft from list
        const list = await listQuotationsForRFQ(rfqId);
        const draft =
          Array.isArray(list)
            ? list.filter(q => q.sellerId === user?.id)
                  .find(q => (q.status || "draft") === "draft") || null
            : null;

        if (!mounted) return;

        setRfq(rfqSnap);

        if (draft) {
          setHeader(h => ({
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
          setItems(
            Array.isArray(draft.items)
              ? draft.items
              : Array.isArray(draft.line_items)
              ? draft.line_items.map(li => ({
                  rfqItemId: li.rfq_item_id ?? li.rfqItemId ?? null,
                  unitPrice: li.unit_price ?? li.unitPrice ?? 0,
                  unit: li.unit || "piece",
                  qtyOffer: li.qty_offer ?? li.qtyOffer ?? 0,
                  discountType: li.discount_type ?? null,
                  discountValue: li.discount_value ?? null,
                  warrantyMonths: li.warranty_months ?? null,
                  _ackSpecs: new Set()
                }))
              : []
          );
        } else {
          // Seed items from RFQ
          const rfqItems = getRfqItems(rfqSnap);
          const seeded = rfqItems.map(it => ({
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
              it.spec_list ||
              (it.specs_map
                ? Object.entries(it.specs_map).map(([key, value]) => ({ key_label: key, value }))
                : [])
          }));
          setItems(seeded);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [rfqId, user?.id]);

  /* ---------- Handlers ---------- */
  const onChangeHeader = (patch) => setHeader(h => ({ ...h, ...patch }));
  const onChangeItem = (idx, patch) =>
    setItems(arr => {
      const next = [...arr];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });

  // Group items by category for Section 1
  const grouped = React.useMemo(() => {
    const byCat = new Map();
    const rfqItems = getRfqItems(rfq);

    rfqItems.forEach((rfqItem) => {
      const cat = getCategoryPath(rfqItem);
      if (!byCat.has(cat)) byCat.set(cat, []);

      const rid = getItemId(rfqItem);
      const idx = items.findIndex(x => x.rfqItemId === rid);
      const qi = idx >= 0 ? items[idx] : null;

      const specs =
        rfqItem.specs ||
        rfqItem.spec_list ||                      // 🔹 add this fallback
        (rfqItem.specs_map
          ? Object.entries(rfqItem.specs_map).map(([k, v]) => ({ key_label: k, value: v }))
          : (qi?._specs || []));

      byCat.get(cat).push({ rfqItem: { ...rfqItem, specs }, i: idx, quoteItem: qi });
    });

    return byCat;
  }, [rfq, items]);

  /* ---------- Save/Submit ---------- */

  async function onSaveDraft() {
    try {
      // compute totals
      const totals = computeQuoteTotals({
        items,
        overallDiscount: +header.overallDiscount || 0,
        taxPercent: +header.taxPercent || 0
      });

      const patch = {
        rfq_id: header.rfqId,
        status: "draft",
        currency: header.currency,
        payment_terms: header.paymentTerms || null,
        shipping_terms: header.deliveryIncoterm || null, // renamed in DB
        delivery_timeline_days: Number(header.deliveryDays) || 0,
        validity_days: Number(header.validityDays) || DEFAULT_VALIDITY,
        internal_reference: header.internalReference || null,
        total_price: totals.grandTotal,
        line_items: uiItemsToDbLineItems(items),
      };

      if (!header.id) {
        const created = await createQuotation(patch);
        const newId = created?.id || created?.quotationId || created;
        if (newId) setHeader(h => ({ ...h, id: newId }));
      } else {
        await updateQuotation(header.id, patch);
      }

      setAutosaveAt(new Date());
    } catch (e) {
      console.error("Save draft failed:", e);
    }
  }

  async function onSubmit() {
    try {
      if (!header.id) {
        // ensure at least one persisted draft exists before submit
        await onSaveDraft();
        if (!header.id) return;
      }
      await updateQuotation(header.id, { status: "submitted" });
      // TODO: navigate to a viewer/success screen
    } catch (e) {
      console.error("Submit failed:", e);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  const totals = computeQuoteTotals({
    items,
    overallDiscount: +header.overallDiscount || 0,
    taxPercent: +header.taxPercent || 0
  });

  return (
    <div className="quote-page max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <QuoteHeader
        rfq={rfq}
        header={header}
        onChange={onChangeHeader}
        autosaveAt={autosaveAt}
      />

      {/* Section 1: Line items grouped by Category */}
      {[...grouped.entries()].length === 0 ? (
        <div className="rounded border bg-white p-4 text-sm text-gray-500">
          No RFQ items found for this request.
        </div>
      ) : (
        [...grouped.entries()].map(([categoryPath, rows]) => (
          <CategoryGroup
            key={categoryPath}
            title={categoryPath}
            rows={rows}
            onChangeItem={onChangeItem}
          />
        ))
      )}

      {/* Section 2: Terms */}
      <QuoteTerms header={header} onChange={onChangeHeader} />

      {/* Section 3: Totals */}
      <QuoteTotals
        header={header}
        totals={totals}
        onChangeHeader={onChangeHeader}
      />

      {/* Footer */}
      <div className="h-16" />
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-3">
          <div className="text-sm text-gray-500">
            {autosaveAt ? `Saved • ${autosaveAt.toLocaleTimeString()}` : "—"}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 border rounded">Preview PDF</button>
            <button className="px-3 py-2 border rounded" onClick={onSaveDraft}>Save Draft</button>
            <button className="px-3 py-2 bg-black text-white rounded" onClick={onSubmit}>
              Submit quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}