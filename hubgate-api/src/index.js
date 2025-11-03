// hubgate-api/src/index.js

import { ok } from "./utils/response.js";
import { corsHeaders, allowOrigin, unauthorized } from "./utils/cors.js";
import { requireAdmin, inviteUserByEmail } from "./lib/auth.js";

import { listSellerRFQs } from "./handlers/seller.js";
import {
  createCompany,
  inviteCompanyUser,
  acceptCompanyInvite,
} from "./handlers/company.js";


export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || "";
    const acao = allowOrigin(origin, env);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(acao) });
    }

    // Health
    if (
      url.pathname === "/api/health" ||
      url.pathname === "/health" ||
      url.pathname === "/healthz"
    ) {
      return ok({ ok: true, service: "hubgate-api", ts: Date.now() }, corsHeaders(acao));
    }

    // Auth redirect passthrough
    if (url.pathname === "/auth/redirect") {
      const forward = new URL("https://app.hubgate.ae/auth/callback");
      for (const [k, v] of url.searchParams) forward.searchParams.set(k, v);
      return Response.redirect(forward.toString(), 302);
    }

    // --- Admin routes (kept here; not moved yet) ---
     if (url.pathname === "/admin/whoami" && req.method === "GET") {
      const isAdmin = await requireAdmin(req, env);
      if (!isAdmin) return unauthorized(acao);
      return ok({ ok: true, role: "SuperAdmin" }, corsHeaders(acao));
    }

    if (url.pathname === "/admin/users.invite" && req.method === "POST") {
      const isAdmin = await requireAdmin(req, env);
      if (!isAdmin) return unauthorized(acao);

      const payload = await req.json().catch(() => ({}));
      
      const email = String(payload.email || "").trim().toLowerCase();
      const roles = Array.isArray(payload.roles) ? payload.roles : [];

      if (!email) {
        return new Response(JSON.stringify({ error: "email required" }), {
          status: 400,
          headers: { "content-type": "application/json", ...corsHeaders(acao) },
        });
      }

      const { status, body } = await inviteUserByEmail(env, email, roles);
      return new Response(JSON.stringify({ status, result: body }), {
        status,
        headers: { "content-type": "application/json", ...corsHeaders(acao) },
      });
    }

      if (url.pathname === "/admin/debug/supabase-host" && req.method === "GET") {
      const isAdmin = await requireAdmin(req, env);
      if (!isAdmin) return unauthorized(acao);
      let host = "BAD_URL";
      try { host = new URL(env.SUPABASE_URL).host; } catch {}
      return ok({ supabaseHost: host }, corsHeaders(acao));
    }

    // --- Seller ---
    if (url.pathname === "/seller/rfqs" && req.method === "GET") {
      return listSellerRFQs(req, env, acao);
    }

    // --- Company ---
    if (url.pathname === "/company/create" && req.method === "POST") {
      return createCompany(req, env, acao);
    }
    if (url.pathname === "/company/invite" && req.method === "POST") {
      return inviteCompanyUser(req, env, acao);
    }
    if (url.pathname === "/company/accept" && req.method === "POST") {
      return acceptCompanyInvite(req, env, acao);
    }

    // Fallback
    return new Response("Not Found", { status: 404, headers: corsHeaders(acao) });
  },
};