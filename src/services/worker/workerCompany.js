// src/services/workerCompany.js
// Company-related calls to the Cloudflare Worker

import { API_BASE, getAuthToken } from "./workerClient";

export async function createCompany({
  name,
  legalName,
  tradeLicenseNo,
  country,
  city,
  phone,
}) {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Build payload with fallbacks
  const payload = {
    name: name.trim(),
    legalName: legalName?.trim() || name.trim(), // fallback to name if empty
    tradeLicenseNo: tradeLicenseNo?.trim() || null,
    country: country?.trim() || null, // UI defaults "UAE", but don't hard-code in worker
    city: city || null,
    phone: phone?.trim() || null,
  };

  const res = await fetch(`${API_BASE}/company/create`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`createCompany failed ${res.status}: ${txt}`);
  }

  return res.json();
}

// Invite a user (by email) to your company
export async function inviteCompanyUser({ email }) {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(`${API_BASE}/company/invite`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email }),
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`inviteCompanyUser failed ${res.status}: ${text}`);
  }

  // Worker returns: { ok: true, invite: {...} }
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error("inviteCompanyUser: invalid JSON response from worker");
  }
}

// Accept a company invite using the invite token
export async function acceptCompanyInvite({ token: inviteToken }) {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(`${API_BASE}/company/accept`, {
    method: "POST",
    headers,
    body: JSON.stringify({ token: inviteToken }),
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`acceptCompanyInvite failed ${res.status}: ${text}`);
  }

  // Worker returns: { ok: true, company_id, membership_id } on success
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error("acceptCompanyInvite: invalid JSON response from worker");
  }
}

// Get current user info with company_id
export async function getMe() {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(`${API_BASE}/me`, {
    method: "GET",
    headers,
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`getMe failed ${res.status}: ${text}`);
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error("getMe: invalid JSON response from worker");
  }
}

// Get invite details by token (public endpoint, no auth required)
export async function getCompanyInvite({ token }) {
  const res = await fetch(`${API_BASE}/company/invite/${encodeURIComponent(token)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`getCompanyInvite failed ${res.status}: ${text}`);
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error("getCompanyInvite: invalid JSON response from worker");
  }
}