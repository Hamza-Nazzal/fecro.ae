// src/services/backends/supabase/rfqs/base.js
import { supabase } from "../../supabase.js";
import { rfqDbToJs, rfqJsToDb } from "../../../../utils/mappers";
import { makeUUID, ensureUniquePublicId } from "../../../ids";

/** Fetch single RFQ row (DB shape) - handles id, public_id, and seller_rfq_id */
/** Uses v_rfqs_card view first (respects RLS), then fetches full row from rfqs table */
export async function fetchRFQRow(id) {
  // First, try to get the RFQ from the view (respects RLS for sellers)
  let { data: viewData, error: viewError } = await supabase
    .from("v_rfqs_card")
    .select("id")
    .or(`id.eq.${id},public_id.eq.${id},seller_rfq_id.eq.${id}`)
    .maybeSingle();
  
  // If found in view, use that id to fetch full row
  if (viewData?.id && !viewError) {
    const actualId = viewData.id;
    const { data, error } = await supabase.from("rfqs").select("*").eq("id", actualId).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data;
  }
  
  // Fallback: try direct lookup (might fail due to RLS, but worth trying)
  let { data, error } = await supabase.from("rfqs").select("*").eq("id", id).maybeSingle();
  
  if (!data && !error) {
    const result = await supabase.from("rfqs").select("*").eq("public_id", id).maybeSingle();
    data = result.data;
    error = result.error;
  }
  
  if (!data && !error) {
    const result = await supabase.from("rfqs").select("*").eq("seller_rfq_id", id).maybeSingle();
    data = result.data;
    error = result.error;
  }
  
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`RFQ not found: ${id}`);
  return data;
}

/** List RFQ rows (DB shape); top-level only */
export async function listRFQRows({ onlyOpen, userId, search } = {}) {
  let q = supabase.from("rfqs").select("*").order("posted_time", { ascending: false });
  if (onlyOpen) q = q.eq("status", "active");
  if (userId) q = q.eq("user_id", userId);
  if (typeof search === "string" && search.trim()) q = q.ilike("title", `%${search}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

/** Insert a new RFQ (DB shape in, DB shape out) */
export async function insertRFQ(rfqJs) {
  const row = rfqJsToDb({ ...rfqJs });
  row.id = row.id || makeUUID();
  if (row.public_id) {
    row.public_id = await ensureUniquePublicId("rfqs", row.public_id, supabase);
  }
  const { data, error } = await supabase.from("rfqs").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

/** Patch RFQ by id (DB shape in, DB shape out) */
export async function patchRFQ(id, updatesJs) {
  const row = rfqJsToDb({ ...updatesJs });
  delete row.id;
  const { data, error } = await supabase
    .from("rfqs")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Delete RFQ row only (no cascade) */
export async function removeRFQ(id) {
  const { error } = await supabase.from("rfqs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

/** Helpers to map lists quickly */
export const mapRowsToJs = (rows) => (rows || []).map(rfqDbToJs);
export const rowToJs = (row) => (row ? rfqDbToJs(row) : null);
