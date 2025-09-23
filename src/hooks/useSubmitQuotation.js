import { useMemo, useState } from "react";
import { createQuotation } from "../services/quotationsService";

function computeTotals(items = []) {
  const normalized = items.map((it) => ({
    item: it.item || "",
    quantity: Number(it.quantity || 0),
    unitPrice: Number(it.unitPrice ?? 0),
  }));

  const withTotals = normalized.map((it) => ({
    ...it,
    total: Number((it.quantity * it.unitPrice).toFixed(2)),
  }));

  const totalPrice = withTotals.reduce((s, it) => s + it.total, 0);
  return { items: withTotals, totalPrice: Number(totalPrice.toFixed(2)) };
}

function validate({ currency, lineItems, deliveryTimelineDays, validityDays }) {
  const errs = {};
  if (!currency) errs.currency = "Currency is required";
  if (!Array.isArray(lineItems) || lineItems.length === 0)
    errs.lineItems = "Add at least one line item";

  lineItems?.forEach((li, i) => {
    if (!li.item) errs[`li_${i}_item`] = "Item is required";
    if (!(Number(li.quantity) > 0)) errs[`li_${i}_qty`] = "Quantity > 0";
    if (!(Number(li.unitPrice) > 0)) errs[`li_${i}_price`] = "Unit price > 0";
  });

  if (deliveryTimelineDays && Number(deliveryTimelineDays) < 1)
    errs.deliveryTimelineDays = "Must be >= 1";
  if (validityDays && Number(validityDays) < 1)
    errs.validityDays = "Must be >= 1";

  return errs;
}

export default function useSubmitQuotation({ rfq, seller }) {
  const [form, setForm] = useState({
    currency: "AED",
    deliveryTimelineDays: 3,
    validityDays: 30,
    paymentTerms: "Net 30",
    shippingTerms: "FOB Origin",
    notes: "",
    lineItems: [{ item: "", quantity: 1, unitPrice: 0 }],
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

   const rfqItems = Array.isArray(rfq?.items) ? rfq.items : [];
  const itemNameToId = useMemo(
    () =>
      new Map(
        rfqItems.map((it) => [
          String(it?.name ?? it?.productName ?? it?.product_name ?? "")
            .trim()
            .toLowerCase(),
          it?.id ?? it?.rfq_item_id ?? null,
        ])
      ),
    [rfqItems]
  );

  const totals = useMemo(() => computeTotals(form.lineItems), [form.lineItems]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateLine(i, patch) {
    setForm((f) => {
      const arr = [...f.lineItems];
      arr[i] = { ...arr[i], ...patch };
      return { ...f, lineItems: arr };
    });
  }

  function addLine() {
    setForm((f) => ({
      ...f,
      lineItems: [...f.lineItems, { item: "", quantity: 1, unitPrice: 0 }],
    }));
  }

  function removeLine(i) {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.filter((_, idx) => idx !== i),
    }));
  }

  async function submit() {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return { ok: false, errors: errs };

    try {
      setSubmitting(true);

            // Build line items with rfq_item_id where we can resolve by name (or future li.rfqItemId)
      const linkedLines = (form.lineItems || []).map((li) => {
        const key = String(li?.item || "").trim().toLowerCase();
        const guessedId = li?.rfqItemId || itemNameToId.get(key) || null;
        const base = {
         item: li.item || "",
          quantity: Number(li.quantity || 0),
          unitPrice: Number(li.unitPrice ?? 0),
        };
        // quotations.line_items is JSONB; triggers read elem->>'rfq_item_id'
        return guessedId ? { ...base, rfq_item_id: guessedId } : base;
      });

      const payload = {
        rfqId: rfq.id,
        sellerId: seller.id,
        sellerCompany: seller.name || seller.company || "",
        currency: form.currency,
        lineItems: linkedLines,
        totalPrice: totals.totalPrice,
        deliveryTimelineDays: Number(form.deliveryTimelineDays) || null,
        paymentTerms: form.paymentTerms || "Net 30",
        shippingTerms: form.shippingTerms || "FOB Origin",
        validityDays: Number(form.validityDays) || 30,
        notes: form.notes || "",
      };

      const created = await createQuotation(payload);
      return { ok: true, data: created };
    } catch (e) {
      return { ok: false, error: e };
    } finally {
      setSubmitting(false);
    }
  }

  return {
    form,
    setForm,
    updateField,
    updateLine,
    addLine,
    removeLine,
    totals,
    errors,
    submitting,
    submit,
  };
}
