// src/services/backends/supabase/events.js
import { supabase } from "../supabase";
import { eventDbToJs, eventJsToDb } from "../../../utils/mappers";

/** Append an event to the RFQ activity stream */
export async function logEvent({ rfqId, action, actor, payload = null }) {
  const row = eventJsToDb({
    rfqId,
    action,
    actor,
    payload,
    createdAt: new Date().toISOString(),
  });
  const { data, error } = await supabase.from("events").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return eventDbToJs(data);
}

/** List latest events for an RFQ (or all, if rfqId not passed) */
export async function listEvents({ rfqId = null, limit = 100 } = {}) {
  let q = supabase.from("events").select("*").order("created_at", { ascending: false }).limit(limit);
  if (rfqId) q = q.eq("rfq_id", rfqId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []).map(eventDbToJs);
}
