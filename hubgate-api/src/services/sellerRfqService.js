// hubgate-api/src/services/sellerRfqService.js
import { supaGETWithUser } from "../lib/supabase.js";
import { mapSellerRfqCard } from "../mappers/sellerRfqCardMapper.js";
import { enrichRfqCardRows } from "../enrichment/enrichRfqCardRows.js";

export async function fetchSellerRfqList(env, bearerToken, queryString) {
  try {
    const { status, json } = await supaGETWithUser(
      env,
      "v_rfqs_card",
      queryString,
      bearerToken
    );

    if (status >= 400) {
      return { error: { status, details: json } };
    }

    const rows = Array.isArray(json) ? json : [];
    
    // Enrich rows (adds items_preview/items_summary if missing)
    const enriched = await enrichRfqCardRows(env, rows);
    
    // Map to camelCase DTO
    const mapped = enriched.map(mapSellerRfqCard);

    return { rows: mapped };
  } catch (e) {
    return { error: { message: String(e) } };
  }
}

export async function hydrateSellerRfq(env, bearer, rfqId, sellerId) {
  const url = `${env.SUPABASE_URL}/rest/v1/rpc/rfq_hydrate_seller`;

  const payload = {
  _rfq_id: rfqId,
  _seller_id: sellerId
};

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "apikey": env.SUPABASE_SERVICE_ROLE,
      "Authorization": `Bearer ${bearer}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    return { error: { status: res.status, body: json } };
  }

  // Map the RPC response to ensure location field is normalized
  const mapped = json;

  return { data: mapped };
}