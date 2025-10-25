// Fecro Admin API Worker (Modules)
// Uses Supabase REST with service role for admin actions.

import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const el = document.getElementById("root");
createRoot(el).render(<App />);




/*

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const { pathname, searchParams } = url;

    if (req.method === "GET" && pathname === "/admin/health") {
      return json({ ok: true, time: new Date().toISOString() });
    }

    // Admin gate: either x-admin-token or Supabase JWT with SuperAdmin role in DB
    const isOk = await isAdmin(req, env);
    if (!isOk) return json({ error: "Forbidden" }, 403);

    try {
      // ---- RFQs: list ----
      if (req.method === "GET" && pathname === "/admin/rfqs") {
        const limit = clampInt(searchParams.get("limit"), 20, 1, 200);
        const offset = clampInt(searchParams.get("offset"), 0, 0, 1_000_000);

        const query = new URL(`${env.SUPABASE_URL}/rest/v1/rfqs`);
        query.searchParams.set("select", "id,public_id,seller_rfq_id,title,status,created_at,buyer_id:user_id");
        query.searchParams.set("order", "created_at.desc");
        query.searchParams.set("limit", String(limit));
        query.searchParams.set("offset", String(offset));

        const rows = await sbGet(env, query);
        return json({ rows, limit, offset });
      }

      // ---- RFQ: detail with items/specs via view ----
      if (req.method === "GET" && pathname.startsWith("/admin/rfqs/")) {
        const id = pathname.split("/").pop();
        if (!isUuid(id)) return json({ error: "invalid id" }, 400);

        const query = new URL(`${env.SUPABASE_URL}/rest/v1/v_rfq_with_items_and_specs`);
        query.searchParams.set("id", `eq.${id}`);
        query.searchParams.set("select", "*");

        const rows = await sbGet(env, query);
        return json({ rfq: rows?.[0] ?? null });
      }

      // ---- RFQ: change status ----
      if (req.method === "POST" && pathname === "/admin/rfqs/status") {
        const body = await readJson(req);
        if (!isUuid(body?.id) || !body?.status) return json({ error: "id & status required" }, 400);

        await sbPatch(env, "rfqs", { status: body.status, updated_at: new Date().toISOString() }, `id=eq.${body.id}`);
        await audit(env, req, "rfq.status", { id: body.id, status: body.status });
        return json({ ok: true });
      }

      // ---- Quotations: list ----
      if (req.method === "GET" && pathname === "/admin/quotations") {
        const limit = clampInt(searchParams.get("limit"), 20, 1, 200);
        const offset = clampInt(searchParams.get("offset"), 0, 0, 1_000_000);

        const query = new URL(`${env.SUPABASE_URL}/rest/v1/quotations`);
        query.searchParams.set("select", "id,rfq_id,seller_id,status,total_price,currency,updated_at");
        query.searchParams.set("order", "updated_at.desc");
        query.searchParams.set("limit", String(limit));
        query.searchParams.set("offset", String(offset));

        const rows = await sbGet(env, query);
        return json({ rows, limit, offset });
      }

      // ---- Quotation: change status ----
      if (req.method === "POST" && pathname === "/admin/quotations/status") {
        const body = await readJson(req);
        if (!isUuid(body?.id) || !body?.status) return json({ error: "id & status required" }, 400);

        await sbPatch(env, "quotations", { status: body.status, updated_at: new Date().toISOString() }, `id=eq.${body.id}`);
        await audit(env, req, "quotation.status", { id: body.id, status: body.status });
        return json({ ok: true });
      }

      // ---- Categories: upsert path (SECURITY DEFINER RPC) ----
      if (req.method === "POST" && pathname === "/admin/categories/upsert-path") {
        const body = await readJson(req);
        const pathText = body?.pathText;
        const scheme = body?.scheme ?? "CUSTOM";
        if (!pathText) return json({ error: "pathText required" }, 400);

        const res = await sbRpc(env, "category_upsert_path", { p_path_text: pathText, p_scheme: scheme });
        const id = Array.isArray(res) ? res?.[0]?.category_upsert_path ?? res?.[0]?.id : res?.id;
        await audit(env, req, "category.upsert_path", { pathText, scheme, id });
        return json({ id });
      }

      // ---- Categories: toggle active ----
      if (req.method === "POST" && pathname === "/admin/categories/toggle") {
        const body = await readJson(req);
        if (!isUuid(body?.id) || typeof body?.is_active !== "boolean") {
          return json({ error: "id & is_active(boolean) required" }, 400);
        }
        const patch = body.is_active
          ? { is_active: true, retired_at: null }
          : { is_active: false, retired_at: new Date().toISOString() };

        await sbPatch(env, "categories", patch, `id=eq.${body.id}`);
        await audit(env, req, "category.toggle", { id: body.id, is_active: body.is_active });
        return json({ ok: true });
      }

      // ---- Roles: set (upsert by user_id) ----
      if (req.method === "POST" && pathname === "/admin/roles/set") {
        const body = await readJson(req);
        if (!isUuid(body?.user_id) || !body?.role) return json({ error: "user_id & role required" }, 400);

        await sbUpsert(env, "roles", [{ user_id: body.user_id, role: body.role }], "user_id");
        await audit(env, req, "roles.set", { user_id: body.user_id, role: body.role });
        return json({ ok: true });
      }

      // ---- Roles: unset (delete by user_id; note: roles has PK on user_id) ----
      if (req.method === "POST" && pathname === "/admin/roles/unset") {
        const body = await readJson(req);
        if (!isUuid(body?.user_id)) return json({ error: "user_id required" }, 400);

        await sbDelete(env, "roles", `user_id=eq.${body.user_id}`);
        await audit(env, req, "roles.unset", { user_id: body.user_id });
        return json({ ok: true });
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: "Internal error", detail: String(err?.message || err) }, 500);
    }
  }
};

// ---------- helpers ---------- 

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });
}
function clampInt(v, def, min, max) {
  const n = parseInt(v ?? def, 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}
function isUuid(x) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x || "");
}
async function readJson(req) {
  if (!req.headers.get("content-type")?.includes("application/json")) return {};
  return await req.json();
}

// ---- Supabase REST helpers (service role) ----
function sbHeaders(env, extra = {}) {
  return {
    "Content-Type": "application/json",
    "apikey": env.SUPABASE_SERVICE_ROLE,
    "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
    ...extra
  };
}
async function sbGet(env, url) {
  const res = await fetch(url, { headers: sbHeaders(env) });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${await res.text()}`);
  return await res.json();
}
async function sbPatch(env, table, patch, where) {
  const url = new URL(`${env.SUPABASE_URL}/rest/v1/${table}`);
  for (const kv of where.split("&")) {
    const [k, v] = kv.split("=");
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    method: "PATCH",
    headers: sbHeaders(env, { Prefer: "return=minimal" }),
    body: JSON.stringify(patch)
  });
  if (!res.ok) throw new Error(`PATCH ${table} -> ${res.status} ${await res.text()}`);
}
async function sbUpsert(env, table, rows, onConflict) {
  const url = new URL(`${env.SUPABASE_URL}/rest/v1/${table}`);
  if (onConflict) url.searchParams.set("on_conflict", onConflict);
  const res = await fetch(url, {
    method: "POST",
    headers: sbHeaders(env, { Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(rows)
  });
  if (!res.ok) throw new Error(`UPSERT ${table} -> ${res.status} ${await res.text()}`);
}
async function sbDelete(env, table, where) {
  const url = new URL(`${env.SUPABASE_URL}/rest/v1/${table}`);
  for (const kv of where.split("&")) {
    const [k, v] = kv.split("=");
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    method: "DELETE",
    headers: sbHeaders(env, { Prefer: "return=minimal" })
  });
  if (!res.ok) throw new Error(`DELETE ${table} -> ${res.status} ${await res.text()}`);
}
async function sbRpc(env, name, payload) {
  const url = `${env.SUPABASE_URL}/rest/v1/rpc/${name}`;
  const res = await fetch(url, {
    method: "POST",
    headers: sbHeaders(env),
    body: JSON.stringify(payload || {})
  });
  if (!res.ok) throw new Error(`RPC ${name} -> ${res.status} ${await res.text()}`);
  return await res.json();
}

// ---- admin gate: x-admin-token or Supabase JWT with roles lookup ----
async function isAdmin(req, env) {
  const hdr = req.headers.get("x-admin-token");
  if (hdr && env.ADMIN_API_TOKEN && hdr === env.ADMIN_API_TOKEN) return true;

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    try {
      const jwt = auth.slice(7);
      const payload = parseJwt(jwt);
      const userId = payload?.sub;
      if (!userId) return false;

      const query = new URL(`${env.SUPABASE_URL}/rest/v1/roles`);
      query.searchParams.set("user_id", `eq.${userId}`);
      query.searchParams.set("role", "eq.SuperAdmin");
      query.searchParams.set("select", "user_id");
      query.searchParams.set("limit", "1");
      const rows = await sbGet(env, query);
      return rows.length > 0;
    } catch {
      return false;
    }
  }
  return false;
}
function parseJwt(token) {
  const [, payload] = token.split(".");
  if (!payload) return null;
  try { return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))); }
  catch { return null; }
}

// ---- optional: audit sink (requires admin_events table & service-role policy) ----
async function audit(env, req, action, target) {
  try {
    const auth = req.headers.get("authorization");
    let admin_sub = null;
    if (auth?.startsWith("Bearer ")) {
      const payload = parseJwt(auth.slice(7));
      admin_sub = payload?.sub || null;
    }
    const url = new URL(`${env.SUPABASE_URL}/rest/v1/admin_events`);
    const res = await fetch(url, {
      method: "POST",
      headers: sbHeaders(env, { Prefer: "return=minimal" }),
      body: JSON.stringify([{ admin_sub, action, payload: target }])
    });
    if (!res.ok) console.warn("audit failed", await res.text());
  } catch (e) {
    console.warn("audit error", e?.message);
  }
}
*/


