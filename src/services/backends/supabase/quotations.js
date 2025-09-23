// src/services/backends/supabase/quotations.js

import { supabase } from "../supabase.js";
import { quotationDbToJs, quotationJsToDb } from "../../../utils/mappers";

/**
 * Robust approach: fetch quotations, then fetch related RFQs in one bulk call,
 * and stitch rfqTitle / rfqPublicId onto each quotation.
 */
export async function listQuotations(filters = {}) {
  const { rfqId, sellerId, status } = filters || {};

  // 1) base quotation rows
  let q = supabase
  .from("quotations")
    .select("*, rfq:rfq_id(id, public_id, title)") // alias to `rfq`
    .order("created_at", { ascending: false });
  
  //.from("quotations").select("*").order("created_at", { ascending: false });
  if (rfqId) q = q.eq("rfq_id", rfqId);
  if (sellerId) q = q.eq("seller_id", sellerId);
  if (status) q = q.eq("status", status);

  const { data: quotes, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (quotes || []).map(quotationDbToJs);

  // 2) bulk fetch related RFQs (single extra query)
  const rfqIds = Array.from(new Set(rows.map(r => r.rfqId).filter(Boolean)));
  let rfqById = new Map();
  if (rfqIds.length) {
    const { data: rfqs, error: rErr } = await supabase
      .from("rfqs")
      .select("id, public_id, title")
      .in("id", rfqIds);
    if (rErr) throw new Error(rErr.message);
    rfqById = new Map((rfqs || []).map(r => [r.id, r]));
  }

  // 3) stitch
  return rows.map(r => {
    const rfq = rfqById.get(r.rfqId);
    return {
      ...r,
      rfqTitle: rfq?.title ?? null,
      rfqPublicId: rfq?.public_id ?? null,
    };
  });
}

export async function getQuotation(id) {
  const { data, error } = await supabase.from("quotations").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return quotationDbToJs(data);
}

export async function createQuotation(quotation) {
  const row = quotationJsToDb(quotation);
  const { data, error } = await supabase.from("quotations").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return quotationDbToJs(data);
}

export async function updateQuotation(id, patch) {
  const row = quotationJsToDb(patch);
  delete row.id;
  const { data, error } = await supabase
    .from("quotations")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return quotationDbToJs(data);
}

export async function deleteQuotation(id) {
  const { error } = await supabase.from("quotations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}
