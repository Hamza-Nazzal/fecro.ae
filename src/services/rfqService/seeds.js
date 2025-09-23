// src/services/rfqService/seeds.js
import { makeUUID } from "../ids";
import { makePublicId } from "./util";

/** Demo RFQs (pure data; unchanged) */
export function seedRFQs(company = "Stationery Plus LLC") {
  const now = new Date().toISOString();
  return [
    {
      id: makeUUID(),
      publicId: makePublicId(6),
      company,
      title: "A4 Printing Paper",
      description: "80 GSM, white.",
      category: "Office Supplies",
      quantity: "2000",
      orderType: "one-time",
      deliveryTime: "7-10 days",
      postedTime: now,
      status: "active",
      quotations: 1,
      views: 45,
      createdAt: now,
    },
    {
      id: makeUUID(),
      publicId: makePublicId(6),
      company,
      title: "Bulk Pens - Branded",
      description: "Blue ink, custom logo print.",
      category: "Promotional",
      quantity: "5000",
      orderType: "one-time",
      deliveryTime: "today",
      postedTime: now,
      status: "paused",
      quotations: 0,
      views: 9,
      createdAt: now,
    },
  ];
}

export function createQuotationRecord(quotationData) {
  const now = new Date().toISOString();
  return {
    id: makeUUID(),
    ...quotationData,
    created_at: now,
    submitted_at: quotationData.status === "submitted" ? now : null,
    expires_at:
      quotationData.status === "submitted" && quotationData.validity_days
        ? new Date(Date.now() + quotationData.validity_days * 86400000).toISOString()
        : null,
  };
}

/** Optional demo seed for quotations (kept for parity) */
export function seedDemoQuotations() {
  return [
    createQuotationRecord({
      rfq_id: "demo-rfq-1",
      seller_id: "demo-seller-1",
      status: "submitted",
      validity_days: 30,
      total_price: 499.99,
      currency: "AED",
    }),
    createQuotationRecord({
      rfq_id: "demo-rfq-2",
      seller_id: "demo-seller-2",
      status: "draft",
      validity_days: 0,
      total_price: 199.0,
      currency: "AED",
    }),
  ];
}
