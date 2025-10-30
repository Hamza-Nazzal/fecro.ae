// src/services/workerApi.js
import { supabase } from "./backends/supabase";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_WORKER_API_BASE) ||
  process.env.REACT_APP_WORKER_API_BASE ||
  "https://api.hubgate.ae";

async function getAuthToken() {
  // Primary: Supabase client
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  return token || "";
}

// Company-isolated seller browse (calls Worker)
export async function sellerListRFQs({ page = 1, pageSize = 20 } = {}) {
  const token = await getAuthToken();
  const url = new URL(`${API_BASE}/seller/rfqs`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Worker seller/rfqs failed ${res.status}: ${txt}`);
  }

  const json = await res.json();
  // Normalize a minimal card shape the UI can render safely
  const rows = (json.rows || []).map((r) => ({
    id: r.id,
    publicId: r.public_id || null,
    sellerRfqId: r.seller_rfq_id || null,

    title: r.title || "",
    firstCategoryPath: r.first_category_path || "",

    itemsCount: Number(r.items_count ?? 0),
    itemsPreview: Array.isArray(r.items_preview)
      ? r.items_preview.map(x => ({
          name: (x && (x.name || x.product_name)) || "",
          qty: Number(x && (x.qty ?? x.quantity ?? 0)) || 0,
        }))
      : [],

    status: r.status || "",
    createdAt: r.created_at || null,
  }));

  return { page: json.page, pageSize: json.pageSize, rows };
}

export async function listSellerRFQs({ page = 1, pageSize = 20 } = {}) {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const res = await fetch(`${API_BASE}/seller/rfqs?page=${page}&pageSize=${pageSize}`, {
    headers,
  });
  if (!res.ok) throw new Error(`Worker rfqs failed ${res.status}`);
  return res.json();
}