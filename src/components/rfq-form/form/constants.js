//src/components/rfq-form/form/constants.js

export const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const BLANK_ITEM = {
  id: null, productName: "", category: "", categoryCommitted: false,
  barcode: "", specifications: {}, quantity: "", purchaseType: "one-time",
};

export const BLANK_ORDER = {
  deliveryTimeline: "standard",
  customDate: "",
  incoterms: "CP",
  paymentTerms: "net-30",
  quoteDeadline: "",
  internalRef: "",
  location: {
    city: "",
    state: "",
    country: "",
  },
};

export const defaultRecommended = (category = "") => {
  const c = (category || "").toLowerCase();
  if (c.includes("paper")) return ["Size","Weight","Color","Finish"];
  if (c.includes("chair") || c.includes("furniture"))
    return ["Material","Color","Dimensions","Weight Capacity","Ergonomic Features"];
  if (c.includes("laptop") || c.includes("computer"))
    return ["Processor","RAM","Storage","Display","Operating System"];
  return ["Material","Color","Dimensions","Brand","Model"];
};
