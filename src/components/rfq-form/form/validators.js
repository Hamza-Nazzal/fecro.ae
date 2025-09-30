export const isBasicsValid = (item) =>
  (item?.productName || "").trim().length >= 2 &&
  !!item?.categoryCommitted &&
  (item?.category || "").trim().length > 0;

export const canSaveItem = (item) => {
  const qty = Number(item?.quantity);
  return isBasicsValid(item) && Number.isFinite(qty) && qty > 0;
};

export const canProceedStep2 = (items, orderDetails) =>
  (Array.isArray(items) && items.length > 0) && !!(orderDetails?.quoteDeadline);
