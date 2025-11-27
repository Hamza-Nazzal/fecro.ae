// src/services/rfqService/reads.js
import { supabase } from "../backends/supabase";
import { rfqCardDbToJs } from "./mapping";
import { enrichRfqCardRows } from "./enrichment";
import { normalizeLocation } from "../../utils/location/normalizeLocation";

// Coalesce identical concurrent calls by params signature
const __inflight = new Map(); // key -> Promise
function __keyFor(params) {
  try { return JSON.stringify(params || {}); } catch { return 'default'; }
}

function normalizeCompanyLocation(row) {
  if (!row || typeof row !== "object") return row;
  
  const normalized = normalizeLocation({
    city: row.company_city ?? row.buyer_company_city ?? row.companyCity ?? row.buyerCompanyCity,
    country: row.company_country ?? row.buyer_company_country ?? row.companyCountry ?? row.buyerCompanyCountry,
    state: row.company_state ?? row.buyer_company_state ?? row.companyState ?? row.buyerCompanyState ?? 
           row.company_emirate ?? row.buyer_company_emirate ?? row.companyEmirate ?? row.buyerCompanyEmirate,
  });

  // Only add normalized fields if at least one has a value
  if (normalized.city == null && normalized.state == null && normalized.country == null) {
    return row;
  }

  return {
    ...row,
    company_city: normalized.city,
    company_country: normalized.country,
    company_state: normalized.state,
  };
}


// Map DB row → UI shape (matches your view columns)


export async function listRFQsForCards({
  page = 1,
  pageSize = 20,
  onlyOpen,
  rfqId,
  buyerId,
  search,
  sort,
} = {}) {
  const key = __keyFor({ page, pageSize, onlyOpen, rfqId, buyerId, search, sort });
  if (__inflight.has(key)) return __inflight.get(key);
  const task = (async () => {
    // --- existing implementation START (unchanged) ---
    let q = supabase.from("v_rfqs_card").select("*");

    if (rfqId) {
      const lookup = [
        `id.eq.${rfqId}`,
        `public_id.eq.${rfqId}`,
        `seller_rfq_id.eq.${rfqId}`,
      ].join(",");
      q = q.or(lookup);
    }
    if (buyerId) q = q.eq("buyer_id", buyerId);

    if (onlyOpen) q = q.eq("status", "active");

    if (search && search.trim()) {
      const s = search.trim();
      q = q.or(
        [
          `title.ilike.%${s}%`,
          `public_id.ilike.%${s}%`,
          `first_category_path.ilike.%${s}%`,
        ].join(",")
      );
    }

    switch (sort) {
      case "posted_asc":
        q = q.order("created_at", { ascending: true });
        break;
      case "deadline_asc":
        q = q.order("created_at", { ascending: true });
        break;
      case "views_desc":
        q = q.order("created_at", { ascending: false });
        break;
      case "posted_desc":
      default:
        q = q.order("created_at", { ascending: false });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    q = q.range(from, to);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const normalizedRows = (data || []).map(normalizeCompanyLocation);
    const enriched = await enrichRfqCardRows(normalizedRows);
    return enriched.map(rfqCardDbToJs);
    // --- existing implementation END ---
  })();
  __inflight.set(key, task);
  try {
    return await task;
  } finally {
    __inflight.delete(key);
  }
}

export async function getRFQById(rfqId) {
  if (!rfqId) throw new Error("rfqId is required");
  const { data, error } = await supabase
    .from("v_rfqs_card")
    .select("*")
    .or(`id.eq.${rfqId},public_id.eq.${rfqId}`)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [enriched] = await enrichRfqCardRows([normalizeCompanyLocation(data)]);
  return rfqCardDbToJs(enriched || data);
}

export async function getRFQ(rfqId) {
  return getRFQById(rfqId);
}

export async function listRFQs(params = {}) {
  return listRFQsForCards(params);
}

export async function listMyRFQs(a, b) {
  if (typeof a === "string" || typeof a === "number") {
    return listRFQsForCards({ ...(b || {}), buyerId: a });
  }
  if (a && typeof a === "object") {
    const { buyerId, userId, ...rest } = a;
    return listRFQsForCards({ buyerId: buyerId ?? userId, ...rest });
  }
  return listRFQsForCards({});
}
