//src/services/quotationsService.js


import {
  listQuotations as beListQuotations,
  createQuotation as beCreateQuotation,
  updateQuotation as beUpdateQuotation,
  deleteQuotation as beDeleteQuotation,
} from "./backends/__active";

import { supabase } from './backends/supabase';
import { getCurrentUserCached } from './backends/supabase/auth';

import { quotationJsToDb, quotationDbToJs } from "../utils/mappers";
//import { updateRFQ } from "./rfqService";

function isoNow() {
  return new Date().toISOString();
}


export async function listMyQuotedRFQIds() {
  const user = await getCurrentUserCached();
  if (!user?.id) return new Set();

  const { data, error } = await supabase
    .from("quotations")
    .select("rfq_id")
    .eq("seller_id", user.id);
  if (error) throw new Error(error.message);

  return new Set((data || []).map((r) => r.rfq_id).filter(Boolean));
}



/**
 * Create quotation with minimal payload and enforced seller identity.
 * Ignores any sellerId provided by callers; uses getCurrentUserCached().
 */
export async function createQuotation(quotationData) {
  const user = await getCurrentUserCached();
  if (!user?.id) throw new Error("Not signed in");

  // Compute total if not provided
  const computedTotal =
    quotationData.totalPrice ??
    (quotationData.lineItems || []).reduce(
      (sum, li) => sum + Number(li.total ?? (li.quantity || 0) * (li.unitPrice || 0)),
      0
    );

  // Minimal, RLS-friendly payload
  const payload = {
    rfqId: quotationData.rfqId,
    sellerId: user.id,                          // <-- enforced here
    currency: quotationData.currency || "AED",
    lineItems: quotationData.lineItems || [],
    totalPrice: Number(computedTotal || 0),
    deliveryTimelineDays: quotationData.deliveryTimelineDays ?? null,
    paymentTerms: quotationData.paymentTerms || "Net 30",
    shippingTerms: quotationData.shippingTerms || "FOB Origin",
    validityDays: quotationData.validityDays ?? 14,
    notes: quotationData.notes || "",
    status: "submitted",
    submittedAt: isoNow(),
  };

  // Call the active backend (maps JS<->DB inside)
  const created = await beCreateQuotation(payload);
  return created ? quotationDbToJs(created) : created;
}



export async function listQuotations(filters = {}) {
  const user = await getCurrentUserCached();
  if (!user?.id) return [];

  const data = await beListQuotations(filters) || [];
  const rows = data.length && 'seller_id' in data[0]
    ? data.map(quotationDbToJs)
    : data;

  return rows.filter((q) => q.sellerId === user.id);
}



export async function updateQuotation(quotationId, updates) {
  const updatesDb = quotationJsToDb(updates);
  if (Array.isArray(updates?.lineItems)) {
    updatesDb.line_items = updates.lineItems.map((li) => ({
      item: li.item,
      quantity: Number(li.quantity || 0),
      unit_price: Number(li.unitPrice ?? 0),
      rfq_item_id: li.rfq_item_id ?? null,
    }));
  }
  const updated = await beUpdateQuotation(quotationId, updatesDb);
  return updated ? quotationDbToJs(updated) : updated;
}

export async function deleteQuotation(quotationId) {
  return beDeleteQuotation(quotationId);
}

export async function listQuotationsForRFQ(rfqId) {
  if (!rfqId) throw new Error("rfqId is required");
  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("rfq_id", rfqId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function acceptQuotation({ quotationId, rfqId }) {
  if (!quotationId) throw new Error("quotationId is required");
  let q = supabase.from("quotations").update({ status: "accepted" }).eq("id", quotationId);
  if (rfqId) q = q.eq("rfq_id", rfqId);
  const { data, error } = await q.select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function rejectQuotation({ quotationId, rfqId }) {
  if (!quotationId) throw new Error("quotationId is required");
  let q = supabase.from("quotations").update({ status: "rejected" }).eq("id", quotationId);
  if (rfqId) q = q.eq("rfq_id", rfqId);
  const { data, error } = await q.select("*").single();
  if (error) throw new Error(error.message);
  return data;
}
