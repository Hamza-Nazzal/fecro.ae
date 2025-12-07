// src/services/quotationsService.js
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
  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("rfq_id", rfqId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function acceptQuotation({ quotationId, rfqId }) {
  if (!quotationId) throw new Error("quotationId is required");
  let q = supabase.from("quotations").update({ status: "accepted" }).eq("id", quotationId);
  if (rfqId) q = q.eq("rfq_id", rfqId);
  const { data, error } = await q.select("*").single();
  if (error) throw new Error(error.message);
  return data ? quotationDbToJs(data) : data;
}

export async function rejectQuotation({ quotationId, rfqId }) {
  if (!quotationId) throw new Error("quotationId is required");
  let q = supabase.from("quotations").update({ status: "rejected" }).eq("id", quotationId);
  if (rfqId) q = q.eq("rfq_id", rfqId);
  const { data, error } = await q.select("*").single();
  if (error) throw new Error(error.message);
  return data ? quotationDbToJs(data) : data;
}

// additional functions for buyer interest in quotations

export async function expressInterestInQuotation({ rfqId, quotationId }) {
  if (!rfqId || !quotationId) {
    throw new Error("rfqId and quotationId are required");
  }

  const user = await getCurrentUserCached();
  if (!user?.id) {
    throw new Error("Not signed in");
  }

  // Load the quotation's seller_id from the quotations table
  const { data: quotationRow, error: quotationError } = await supabase
    .from("quotations")
    .select("seller_id")
    .eq("id", quotationId)
    .single();

  if (quotationError || !quotationRow || !quotationRow.seller_id) {
    throw new Error("Unable to find seller for quotation");
  }

  const sellerId = quotationRow.seller_id;

  // Check if interest already exists for this buyer and quotation
  let query = supabase
    .from("quotation_interest")
    .select("*")
    .eq("quotation_id", quotationId)
    .eq("rfq_id", rfqId)
    .eq("buyer_id", user.id)
    .eq("seller_id", sellerId);

  const { data: existing, error: selectError } = await query;

  if (selectError) {
    throw new Error(selectError.message || "Failed to check existing interest");
  }

  // If a row exists with status in (pending, approved, rejected), return it
  if (existing && existing.length > 0) {
    const existingRow = existing.find(
      (row) => ["pending", "approved", "rejected"].includes(row.status)
    );
    if (existingRow) {
      return existingRow;
    }
  }

  // Insert new interest row
  const { data, error } = await supabase
    .from("quotation_interest")
    .insert({
      rfq_id: rfqId,
      quotation_id: quotationId,
      buyer_id: user.id,
      seller_id: sellerId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to express interest in quotation");
  }

  return data;
}

export async function fetchBuyerInterestForQuotation({ rfqId, quotationId }) {
  if (!quotationId) {
    throw new Error("quotationId is required");
  }

  let query = supabase
    .from("quotation_interest")
    .select("*")
    .eq("quotation_id", quotationId);

  if (rfqId) {
    query = query.eq("rfq_id", rfqId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to load buyer interest for quotation");
  }

  // RLS should limit to current buyer, expect at most one row
  const row = data && data.length > 0 ? data[0] : null;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    status: row.status,
    rfqId: row.rfq_id,
    quotationId: row.quotation_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    resolutionNote: row.resolution_note,
  };
}

export async function fetchSellerInterestForQuotation({ quotationId }) {
  if (!quotationId) {
    throw new Error("quotationId is required");
  }

  const { data, error } = await supabase
    .from("quotation_interest")
    .select("*")
    .eq("quotation_id", quotationId);

  if (error) {
    throw new Error(error.message || "Failed to load seller interest for quotation");
  }

  // RLS already ensures: seller_id = auth.uid()
  // Expect at most one row
  const row = data && data.length > 0 ? data[0] : null;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    status: row.status,
    rfqId: row.rfq_id,
    quotationId: row.quotation_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    resolutionNote: row.resolution_note,
  };
}

export async function updateQuotationInterestStatus({ id, status, resolutionNote }) {
  if (!id) {
    throw new Error("id is required");
  }

  if (!status || !["approved", "rejected"].includes(status)) {
    throw new Error("status must be 'approved' or 'rejected'");
  }

  const updateData = {
    status,
    resolution_note: resolutionNote || null,
    resolved_at: status === "approved" || status === "rejected" ? isoNow() : null,
  };

  const { data, error } = await supabase
    .from("quotation_interest")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update quotation interest status");
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    status: data.status,
    rfqId: data.rfq_id,
    quotationId: data.quotation_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    resolvedAt: data.resolved_at,
    resolutionNote: data.resolution_note,
  };
}

/**
 * List all pending interests for the current seller.
 * RLS ensures only interests for quotations owned by the current seller are returned.
 * @returns {Promise<Array>} Array of normalized interest objects with camelCase fields
 */
export async function listPendingInterestsForCurrentSeller() {
  const user = await getCurrentUserCached();
  if (!user?.id) return [];

  const { data, error } = await supabase
    .from("quotation_interest")
    .select("*")
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message || "Failed to load pending interests");
  }

  // RLS already filters by seller_id = auth.uid()
  return (data || []).map((row) => ({
    id: row.id,
    rfqId: row.rfq_id,
    quotationId: row.quotation_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Check if the current seller has any pending interests.
 * @returns {Promise<boolean>}
 */
export async function hasPendingInterestsForCurrentSeller() {
  const interests = await listPendingInterestsForCurrentSeller();
  return interests.length > 0;
}
