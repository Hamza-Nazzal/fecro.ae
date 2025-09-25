// src/services/rfqService/reads.js
import { supabase } from "../backends/supabase";

function sellerIdDisplayFromRow(row) {
  if (row?.seller_id_display) return row.seller_id_display;
  const baseId = row?.id;
  if (baseId === undefined || baseId === null) return null;
  const input = String(baseId);
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hash = ((h1 ^ h2) >>> 0).toString(16).padStart(10, "0").slice(0, 10).toUpperCase();
  return `SRF-${hash}`;
}

// Map DB row → UI shape (matches your view columns)
export function rfqCardDbToJs(row) {
  return {
    id: row?.id,
    publicId: row?.public_id ?? row?.id,
    sellerIdDisplay: sellerIdDisplayFromRow(row),
    title: row?.title ?? "Untitled RFQ",
    status: row?.status ?? "active",               // your data uses 'active'
    postedAt: row?.created_at ?? null,
    deadline: null,                                 // not in your view
    // IMPORTANT: expose buyerId at the root so list screens can match it
    buyerId: row?.buyer_id ?? null,
    buyer: row?.buyer_id ? { id: row.buyer_id } : null,
    views: 0,                                       // not in your view
    quotationsCount: 0,                             // not in your view
    items: [],                                      // not in your view
    categoryPath: row?.first_category_path ?? "",   // your view uses first_category_path
    notes: null,                                    // not in your view
    qtyTotal: row?.qty_total ?? null,               // optional for chips
  };
}

/**
 * Server-side list with filters/search/sort/paging (aligned to your view).
 */
export async function listRFQsForCards({
  page = 1,
  pageSize = 20,
  onlyOpen,          // UI toggle; in your schema this means status='active'
  rfqId,
  buyerId,
  // sellerId,       // not present in your view
  search,
  sort,              // "posted_desc" | "posted_asc" | "deadline_asc" | "views_desc"
} = {}) {
  let q = supabase.from("v_rfqs_card").select("*");

  if (rfqId) q = q.or(`id.eq.${rfqId},public_id.eq.${rfqId}`);
  if (buyerId) q = q.eq("buyer_id", buyerId);

  // Your “open” = 'active'
  if (onlyOpen) q = q.eq("status", "active");

  // Search fields that exist in your view
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

  // Sort safely using available columns
  switch (sort) {
    case "posted_asc":
      q = q.order("created_at", { ascending: true });
      break;
    case "deadline_asc":
      // no deadline column → fall back to created_at asc
      q = q.order("created_at", { ascending: true });
      break;
    case "views_desc":
      // no views column → fall back to created_at desc
      q = q.order("created_at", { ascending: false });
      break;
    case "posted_desc":
    default:
      q = q.order("created_at", { ascending: false });
  }

  // Pagination (1-based)
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  q = q.range(from, to);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []).map(rfqCardDbToJs);
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
  return data ? rfqCardDbToJs(data) : null;
}

/* ------- Back-compat aliases expected elsewhere ------- */

export async function getRFQ(rfqId) {
  return getRFQById(rfqId);
}

export async function listRFQs(params = {}) {
  return listRFQsForCards(params);
}

// listMyRFQs(userId, opts?) OR listMyRFQs({ buyerId|userId, ...opts })
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
