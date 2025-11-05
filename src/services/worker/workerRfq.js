// src/services/workerRfq.js
// RFQ-related calls to the Cloudflare Worker

import { API_BASE, getAuthToken } from "./workerClient";

export async function sellerListRFQs({ page = 1, pageSize = 20 } = {}) {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const search = new URLSearchParams();
  search.set("page", String(page));
  search.set("pageSize", String(pageSize));

  const res = await fetch(`${API_BASE}/seller/rfqs?${search.toString()}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`sellerListRFQs failed ${res.status}: ${txt}`);
  }

  const data = await res.json().catch(() => null);
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response from worker /seller/rfqs");
  }

  return {
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    count: data.count ?? (Array.isArray(data.rows) ? data.rows.length : 0),
    rows: Array.isArray(data.rows) ? data.rows : [],
  };
}

export async function listSellerRFQs({ page = 1, pageSize = 20 } = {}) {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const search = new URLSearchParams();
  search.set("page", String(page));
  search.set("pageSize", String(pageSize));

  const res = await fetch(`${API_BASE}/seller/rfqs?${search.toString()}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`listSellerRFQs failed ${res.status}: ${txt}`);
  }

  const data = await res.json().catch(() => null);
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response from worker /seller/rfqs");
  }

  return {
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    count: data.count ?? (Array.isArray(data.rows) ? data.rows.length : 0),
    rows: Array.isArray(data.rows) ? data.rows : [],
  };
}