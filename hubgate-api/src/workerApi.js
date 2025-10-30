// src/services/workerApi.js
import { supabase } from "./backends/supabase";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (typeof window !== "undefined" ? "https://api.hubgate.ae" : "");

// Get the current Supabase access token for the logged-in user
export async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data?.session?.access_token || "";
  if (!token) throw new Error("Not signed in (no access token)");
  return token;
}

// Company-isolated seller browse (calls Worker)
export async function sellerListRFQs({ page = 1, pageSize = 20 } = {}) {
  const token = await getAccessToken();
  const url = new URL(`${API_BASE}/seller/rfqs`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Worker seller/rfqs failed ${res.status}: ${txt}`);
  }

  const json = await res.json();
  // Normalize a minimal card shape the UI can render safely
  const rows = (json.rows || []).map((r) => ({
    id: r.id,
    publicId: r.public_id,
    buyerId: r.buyer_id,
    buyerCompanyId: r.buyer_company_id,
    status: r.status,
    createdAt: r.created_at,
    itemsCount: Number(r.items_count || 0),
    // safe fallbacks so existing cards don't crash if they reference missing fields
    title: r.title || r.public_id || "RFQ",
    first_category_path: r.first_category_path || null,
  }));

  return { page: json.page, pageSize: json.pageSize, rows };
}
