import { supabase } from "../backends/supabase";
import { quotationDbToJs, quotationJsToDb } from "../../utils/mappers/quotation";

// ✅ fetch my draft for a given RFQ
export async function getDraft({ rfqId }) {
  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("rfq_id", rfqId)
    .eq("status", "draft")
    .limit(1)
    .single();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data ? quotationDbToJs(data) : null;
}

// ✅ atomic create/update via RPC quotation_upsert
export async function upsert(quotation) {
  const { header, items } = quotationJsToDb(quotation);
  const { data, error } = await supabase.rpc("quotation_upsert", {
    p_header: header,
    p_items: items
  });
  if (error) throw new Error(error.message);
  return data; // quotation id
}

// ✅ submit via RPC quotation_submit
export async function submit(quotationId) {
  const { error } = await supabase.rpc("quotation_submit", { p_id: quotationId });
  if (error) throw new Error(error.message);
}