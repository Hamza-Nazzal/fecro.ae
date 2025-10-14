//src/utils/validators/quotation.js

export function validateItem(it){
  const errors = {};
  if (!it.unit || !it.unit.trim()) errors.unit = "Unit is required";
  if (it.unitPrice === undefined || +it.unitPrice <= 0) errors.unitPrice = "Price per unit is required";
  if (it.qtyOffer === undefined || +it.qtyOffer <= 0) errors.qtyOffer = "Quantity must be > 0";
  if (it.discountType === "percent" && (+it.discountValue < 0 || +it.discountValue > 100)) errors.discountValue = "0–100%";
  if (it.discountType === "amount" && (+it.discountValue < 0)) errors.discountValue = "Must be ≥ 0";
  return errors;
}

export function validateHeader(h){
  const errors = {};
  if (!h.paymentTerms) errors.paymentTerms = "Required";
  if (!h.deliveryIncoterm) errors.deliveryIncoterm = "Required";
  if (+h.validityDays < 1 || +h.validityDays > 30) errors.validityDays = "1–30";
  return errors;
}