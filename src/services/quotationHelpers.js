// src/utils/quotationUtils.js

// ===== STATUS LABELS & COLORS =====
export const QUOTATION_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
};

export const QUOTATION_STATUS_COLORS = {
  draft: 'gray',
  submitted: 'blue',
  accepted: 'green',
  rejected: 'red',
  withdrawn: 'orange',
  expired: 'gray',
};

// ===== CORE UTILITIES =====
const num = (val, fallback = 0) => Number(val) || fallback;
const req = (field) => `${field} is required`;
const pos = (field) => `${field} must be greater than 0`;

// ===== PERMISSIONS =====
const PERMISSION_RULES = {
  edit: { roles: ['seller'], statuses: ['draft', 'submitted'] },
  submit: { roles: ['seller'], statuses: ['draft'] },
  withdraw: { roles: ['seller'], statuses: ['submitted'] },
  accept: { roles: ['buyer'], statuses: ['submitted'], rfqActive: true },
  reject: { roles: ['buyer'], statuses: ['submitted'] },
};

function checkPermission(action, quotation, rfq, userId) {
  if (!quotation || !userId) return false;

  const rule = PERMISSION_RULES[action];
  if (!rule) return false;

  if (rule.roles[0] === 'seller') {
    if (quotation.sellerId !== userId) return false;
  } else {
    if (!rfq || rfq.userId !== userId) return false;
  }

  if (!rule.statuses.includes(quotation.status)) return false;

  if (rule.rfqActive && rfq?.status !== 'active') return false;

  return true;
}

export const canEditQuotation = (q, u) => checkPermission('edit', q, null, u);
export const canSubmitQuotation = (q, u) => checkPermission('submit', q, null, u);
export const canWithdrawQuotation = (q, u) => checkPermission('withdraw', q, null, u);
export const canAcceptQuotation = (q, r, u) => checkPermission('accept', q, r, u);
export const canRejectQuotation = (q, r, u) => checkPermission('reject', q, r, u);

// ===== CALCULATIONS =====
export const calculateLineItemTotal = (item) => num(item.quantity) * num(item.unitPrice);
export const calculateQuotationTotal = (items) =>
  Array.isArray(items)
    ? items.reduce((sum, item) => sum + calculateLineItemTotal(item), 0)
    : 0;

// ===== VALIDATION =====
function validateField(value, rules) {
  const errors = [];
  if (rules.required && !value) errors.push(req(rules.name));
  if (rules.positive && value && num(value.toString().trim()) <= 0) errors.push(pos(rules.name));
  if (rules.trim && value && !value.toString().trim()) errors.push(req(rules.name));
  return errors;
}

export function validateLineItem(item) {
  const errors = [
    ...validateField(item.item, { required: true, trim: true, name: 'Item name' }),
    ...validateField(item.quantity, { required: true, positive: true, name: 'Quantity' }),
    ...validateField(item.unitPrice, { required: true, positive: true, name: 'Unit price' }),
  ];
  return { isValid: errors.length === 0, errors };
}

export function validateQuotationData(data) {
  const errors = [
    ...validateField(data.rfqId, { required: true, name: 'RFQ ID' }),
    ...validateField(data.sellerId, { required: true, name: 'Seller ID' }),
    ...validateField(data.totalPrice, { required: true, positive: true, name: 'Total price' }),
    ...validateField(data.currency, { required: true, name: 'Currency' }),
    ...validateField(data.deliveryTimelineDays, { positive: true, name: 'Delivery timeline' }),
    ...validateField(data.validityDays, { positive: true, name: 'Validity period' }),
  ];

  if (data.lineItems?.length) {
    data.lineItems.forEach((item, i) => {
      const validation = validateLineItem(item);
      errors.push(...validation.errors.map((err) => `Line item ${i + 1}: ${err}`));
    });
  }

  return { isValid: errors.length === 0, errors };
}

// ===== EXPIRY =====
export const isQuotationExpired = (q) =>
  q.expiresAt ? new Date() > new Date(q.expiresAt) : false;

export function getQuotationExpiryStatus(quotation) {
  if (!quotation.expiresAt) return null;

  const hours = (new Date(quotation.expiresAt) - new Date()) / 3600000;

  if (hours <= 0) return { status: 'expired', message: 'Expired' };
  if (hours <= 24) return { status: 'expiringSoon', message: `Expires in ${Math.ceil(hours)} hours` };
  if (hours <= 72)
    return { status: 'expiringThisWeek', message: `Expires in ${Math.ceil(hours / 24)} days` };
  return { status: 'active', message: 'Active' };
}

// ===== SORTING & FILTERING =====
const sortBy = (arr, fn, asc = true) =>
  [...arr].sort((a, b) => (asc ? fn(a) - fn(b) : fn(b) - fn(a)));

export const sortQuotationsByPrice = (arr, asc) => sortBy(arr, (q) => num(q.totalPrice), asc);
export const sortQuotationsByDelivery = (arr, asc) =>
  sortBy(arr, (q) => num(q.deliveryTimelineDays, Infinity), asc);

export const filterQuotationsByStatus = (arr, statuses) =>
  Array.isArray(statuses) ? arr.filter((q) => statuses.includes(q.status)) : arr;

export const filterQuotationsByPriceRange = (arr, min = 0, max = Infinity) =>
  arr.filter((q) => {
    const p = num(q.totalPrice);
    return p >= min && p <= max;
  });

// ===== SUMMARY =====
export function getQuotationSummary(quotations) {
  if (!quotations?.length)
    return { count: 0, avgPrice: 0, minPrice: 0, maxPrice: 0, avgDelivery: 0, statusCounts: {} };

  const prices = quotations.map((q) => num(q.totalPrice)).filter((p) => p > 0);
  const deliveries = quotations.map((q) => num(q.deliveryTimelineDays)).filter((d) => d > 0);
  const statusCounts = quotations.reduce(
    (acc, q) => ({ ...acc, [q.status]: (acc[q.status] || 0) + 1 }),
    {}
  );

  return {
    count: quotations.length,
    avgPrice: prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    avgDelivery: deliveries.length ? deliveries.reduce((s, d) => s + d, 0) / deliveries.length : 0,
    statusCounts,
  };
}

// ===== LINE ITEMS =====
export const createEmptyLineItem = () => ({ item: '', quantity: 1, unitPrice: 0, total: 0 });
export const updateLineItemTotal = (item) => ({ ...item, total: calculateLineItemTotal(item) });

// ===== CURRENCY (AED ONLY) =====
export function formatCurrency(amount, currency = 'AED') {
  return `AED ${num(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getCurrencySymbol(currencyCode = 'AED') {
  return 'AED';
}

// ===== TEMPLATES =====
export const INITIAL_QUOTATION_DATA = {
  totalPrice: 0,
  currency: 'AED',
  deliveryTimelineDays: 14,
  notes: '',
  lineItems: [createEmptyLineItem()],
  paymentTerms: 'Net 30',
  shippingTerms: 'FOB Origin',
  validityDays: 30,
  status: 'draft',
};

export const createNewQuotationData = (rfqId, sellerId, overrides = {}) => ({
  ...INITIAL_QUOTATION_DATA,
  rfqId,
  sellerId,
  lineItems: [createEmptyLineItem()],
  ...overrides,
});
