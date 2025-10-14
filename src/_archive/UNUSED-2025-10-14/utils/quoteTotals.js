//src/utils/quoteTotals.js

export function lineEffectiveTotal({ unitPrice, qtyOffer, discountType, discountValue }) {
  const base = (+unitPrice || 0) * (+qtyOffer || 0);
  if (!discountType) return round2(base);
  if (discountType === "percent") return round2(base * (1 - (Math.min(Math.max(+discountValue,0),100)/100)));
  if (discountType === "amount")  return round2(Math.max(base - (+discountValue || 0), 0));
  return round2(base);
}

export function computeQuoteTotals({ items, overallDiscount = 0, taxPercent = 5 }) {
  const itemsTotal = round2((items || []).reduce((s, it) => s + lineEffectiveTotal(it), 0));
  const subtotalAfterDiscount = round2(Math.max(itemsTotal - (+overallDiscount || 0), 0));
  const taxAmount = round2(subtotalAfterDiscount * ((+taxPercent || 0)/100));
  const grandTotal = round2(subtotalAfterDiscount + taxAmount);
  return { itemsTotal, subtotalAfterDiscount, taxAmount, grandTotal };
}

function round2(n){ return Math.round((+n + Number.EPSILON) * 100) / 100; }