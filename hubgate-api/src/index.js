const ok = (data, extra = {}) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...extra,
    },
  });

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
    "vary": "origin",
  };
}

function allowOrigin(origin, env) {
  const allow = String(env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  return allow.includes(origin) ? origin : "";
}

function unauthorized(origin = "") {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json", ...corsHeaders(origin) },
  });
}

function jsonResponse(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(origin) },
  });
}

async function requireAdmin(req, env) {
  const hdr = req.headers.get("authorization") || "";
  const token = hdr.toLowerCase().startsWith("bearer ") ? hdr.slice(7) : "";
  return token && token === env.ADMIN_BEARER;
}

async function requireUser(req, env) {
  const hdr = req.headers.get("authorization") || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (!token) {
    return { ok: false, res: new Response(JSON.stringify({ error: "missing_bearer" }), { status: 401, headers: { "content-type": "application/json" } }) };
  }
  // validate token with Supabase Auth using the ANON key
  const r = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`,
    },
  });
  if (!r.ok) {
    return { ok: false, res: new Response(JSON.stringify({ error: "invalid_token" }), { status: 401, headers: { "content-type": "application/json" } }) };
  }
  const user = await r.json();
  
  // Fetch and attach company_id from company_memberships
  const company_id = await getCompanyIdForUser(env, user.id);
  if (company_id) {
    user.company_id = company_id;
  }
  
  return { ok: true, user };
}

function hasSellerRole(user) {
  const roles =
    user?.user_metadata?.roles ||
    user?.app_metadata?.roles ||
    [];
  return Array.isArray(roles) && roles.includes("seller");
}

async function inviteUserByEmail(env, email, roles = []) {
  // Uses Supabase Auth "invite" endpoint. SMTP (Resend) sends the email.
  const url = `${env.SUPABASE_URL}/auth/v1/invite`;
  const body = JSON.stringify({
    email,
    data: { roles },                   // stored as user_metadata.roles
    redirect_to: "https://api.hubgate.ae/auth/redirect", // ensure allowed redirect
  });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
    body,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, body: json };
}

function b64urlToStr(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  if (pad) s += "=".repeat(pad);
  return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));
}

async function getUserIdFromJWT(req, env) {
  const hdr = req.headers.get("authorization") || "";
  if (!/^bearer\s+/i.test(hdr)) return null;
  const token = hdr.slice(7);
  const resp = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      // either anon or service key is fine for this call; you already have service key set
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  return json?.id || null;
}


async function supaPOSTService(env, table, rows) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase POST ${table} failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function supaGETService(env, path) {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase GET failed ${res.status}: ${text}`);
  }
  const data = await res.json();
  return { data };
}

async function supaPATCHService(env, table, rowId, patch) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(rowId)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(patch || {}),
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error(`Supabase PATCH ${table} failed ${res.status}: ${text}`);
  }
  return { data: Array.isArray(json) ? json : [json], error: null };
}

async function getCompanyIdForUser(env, userId) {
  // Fetch company_id from company_memberships for the user
  // Using service key to bypass RLS if needed
  const url = `${env.SUPABASE_URL}/rest/v1/company_memberships?user_id=eq.${userId}&select=company_id&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      accept: "application/json",
    },
  });
  if (!res.ok) {
    // If query fails, return null (user may not have a company yet)
    return null;
  }
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0].company_id : null;
}

async function supaGETWithUser(env, table, qs, userJWT) {
  // Ensure qs has no leading "?"
  const clean = String(qs || "").replace(/^\?+/, "");
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?${clean}`;

  // Log final URL to tail so we can *see* if the "?" is present
  console.log("POSTGREST GET:", url);

  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${userJWT}`,
      accept: "application/json",
    },
  });

  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }

  if (!res.ok) {
    // bubble a readable error (avoid crashing Worker)
    throw new Error(`Supabase GET ${table} failed ${res.status}: ${text}`);
  }
  return { status: res.status, json };
}

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
    if (url.pathname === "/api/health" || url.pathname === "/health" || url.pathname === "/healthz") {
      return ok({ ok: true, service: "hubgate-api", ts: Date.now() }, corsHeaders(acao));
    }

    // Admin: whoami (simple bearer)
    if (url.pathname === "/admin/whoami" && req.method === "GET") {
      const isAdmin = await requireAdmin(req, env);
      if (!isAdmin) return unauthorized(acao);
      return ok({ ok: true, role: "SuperAdmin" }, corsHeaders(acao));
    }

    // Admin: users.invite  (POST JSON: { email, roles?: ["buyer"|"seller"] })
    if (url.pathname === "/admin/users.invite" && req.method === "POST") {
      const isAdmin = await requireAdmin(req, env);
      if (!isAdmin) return unauthorized(acao);

      const payload = await req.json().catch(() => ({}));
      const email = String(payload.email || "").trim().toLowerCase();
      const roles = Array.isArray(payload.roles) ? payload.roles : [];

      if (!email) {
        return new Response(JSON.stringify({ error: "email required" }), {
          status: 400, headers: { "content-type": "application/json", ...corsHeaders(acao)  }
        });
      }

      const { status, body } = await inviteUserByEmail(env, email, roles);
      return new Response(JSON.stringify({ status, result: body }), {
        status, headers: { "content-type": "application/json", ...corsHeaders(acao) }
      });
    }

    // Admin: debug supabase host
    if (url.pathname === "/admin/debug/supabase-host" && req.method === "GET") {
      const isAdmin = await requireAdmin(req, env);
      if (!isAdmin) return unauthorized(acao);
      const host = (() => { try { return new URL(env.SUPABASE_URL).host; } catch { return "BAD_URL"; }})();
      return ok({ supabaseHost: host }, corsHeaders(acao));
    }

    // Auth redirect: forward Supabase params to the frontend app
    if (url.pathname === "/auth/redirect") {
      const forward = new URL("https://app.hubgate.ae/auth/callback");
      for (const [k, v] of url.searchParams) forward.searchParams.set(k, v);
      return Response.redirect(forward.toString(), 302);
    }

    // --- Seller RFQs (cards) ---
    if (url.pathname === "/seller/rfqs" && req.method === "GET") {
      const authCheck = await requireUser(req, env);
      if (!authCheck.ok) return authCheck.res;
      const user = authCheck.user;
      
      if (!hasSellerRole(user)) {
        return new Response(JSON.stringify({ error: "forbidden_not_seller" }), {
          status: 403,
          headers: { "content-type": "application/json", ...corsHeaders(acao) },
        });
      }

      try {
        // paging (safe)
        const page = Math.max(1, Number(url.searchParams.get("page") || 1));
        const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("pageSize") || 20)));
        const offset = (page - 1) * pageSize;

        // columns (must exist in view; see Step 4 if not)
        const selectCols = [
          "id",
          "public_id",
          "seller_rfq_id",
          "buyer_id",
          "buyer_company_id",
          "status",
          "created_at",
          "title",
          "first_category_path",
          "items_count",
          "items_preview",
        ].join(",");

        // PostgREST query params
        const qp = new URLSearchParams();
        qp.set("select", selectCols);
        qp.set("status", "eq.active");
        qp.set("order", "created_at.desc");
        qp.set("limit", String(pageSize));
        qp.set("offset", String(offset));

        // authenticate user via JWT
        const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        if (!bearer) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders(acao) });
        const { status, json } = await supaGETWithUser(env, "v_rfqs_card", qp.toString(), bearer);

        if (status >= 400) {
          // Do NOT throw; return upstream error as JSON to avoid Worker 1101
          console.error("Supabase REST error", status, json);
          return new Response(JSON.stringify({ error: "upstream_error", status, details: json }), {
            status,
            headers: { "content-type": "application/json", ...corsHeaders(acao) },
          });
        }

        const rows = Array.isArray(json) ? json : [];
        return ok({ page, pageSize, count: rows.length, rows }, corsHeaders(acao));
      } catch (e) {
        console.error("seller/rfqs crash:", e && (e.stack || e.message || e));
        return new Response(JSON.stringify({ error: "worker_crash", message: String(e) }), {
          status: 500,
          headers: { "content-type": "application/json", ...corsHeaders(acao) },
        });
      }
    }

    // CORS preflight for company endpoints
    if (req.method === "OPTIONS" && url.pathname.startsWith("/company/")) {
      return new Response(null, { status: 200, headers: corsHeaders(acao) });
    }

    // POST /company/create  -> creates company, adds caller as procurement manager (lvl 30, primary)
    if (url.pathname === "/company/create" && req.method === "POST") {
      const authCheck = await requireUser(req, env); // verifies Supabase JWT
      if (!authCheck.ok) return authCheck.res;
      const user = authCheck.user;

      const payload = await req.json().catch(() => ({}));
      const name = (payload?.name || "").trim();

      if (!name) {
        return new Response(JSON.stringify({ error: "name_required" }), {
          status: 400,
          headers: { "content-type": "application/json", ...corsHeaders(acao) },
        });
      }

      try {
        // 1) create company
        const [company] = await supaPOSTService(env, "companies", { name });

        // 2) create membership for caller
        const [m] = await supaPOSTService(env, "company_memberships", {
          company_id: company.id,
          user_id: user.id,
          track: "procurement",
          role_level: 30,
        });

        return new Response(
          JSON.stringify({
            companyId: company.id,
            name: company.name ?? name,
            membershipId: m.id,
          }),
          { status: 200, headers: { "content-type": "application/json", ...corsHeaders(acao) } }
        );
      } catch (e) {
        console.error("company/create crash:", e && (e.stack || e.message || e));
        return new Response(JSON.stringify({ error: "worker_crash", message: String(e) }), {
          status: 500,
          headers: { "content-type": "application/json", ...corsHeaders(acao) },
        });
      }
    }

    // POST /company/invite -> creates company invite
    if (url.pathname === "/company/invite" && req.method === "POST") {
      const authCheck = await requireUser(req, env);

      if (!authCheck.ok) return authCheck.res;

      const user = authCheck.user;

      const { email } = await req.json();
      if (!email) return jsonResponse({ error: "missing_email" }, 400, acao);

      const token = crypto.randomUUID();

      try {
        const result = await supaPOSTService(env, "company_invites", {
          company_id: user.company_id, // or derive from memberships
          email,
          invited_by: user.id,
          token,
        });

        const invite = Array.isArray(result) ? result[0] : result;
        return jsonResponse({ ok: true, invite }, 200, acao);
      } catch (err) {
        return jsonResponse({ error: "invite_create_failed", details: err.message || String(err) }, 500, acao);
      }
    }

    // POST /company/accept -> accepts company invite
    if (url.pathname === "/company/accept" && req.method === "POST") {
      const authCheck = await requireUser(req, env);
      if (!authCheck.ok) return authCheck.res;
      const user = authCheck.user;

      try {
        const body = await req.json();
        const token = body.token?.trim();
        if (!token) return jsonResponse({ error: "missing_token" }, 400, acao);

        // 1. Fetch pending invite by token
        const { data: invites, error: fetchErr } = await supaGETService(
          env,
          `company_invites?token=eq.${encodeURIComponent(token)}&status=eq.pending`
        );
        if (fetchErr) throw new Error(fetchErr.message);
        const invite = (invites || [])[0];
        if (!invite) return jsonResponse({ error: "invalid_or_expired" }, 404, acao);

        if (invite.email && user.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
          return jsonResponse({ error: "invite_email_mismatch" }, 403, acao);
        }

        // 2. Create company membership
        let membershipId;

        try {
          const [membership] = await supaPOSTService(env, "company_memberships", {
            company_id: invite.company_id,
            user_id: user.id,
            track: "sales",
            role_level: 10,
          });
          membershipId = membership.id;
        } catch (e) {
          const msg = String(e.message || e);
          const isDuplicate = msg.includes('"code":"23505"') || msg.includes("company_memberships_company_id_user_id_key");
          if (!isDuplicate) throw e;
          // already a member → look it up
          const { data: existing } = await supaGETService(
            env,
            `company_memberships?company_id=eq.${encodeURIComponent(invite.company_id)}&user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`
          );
          membershipId = existing?.[0]?.id || null;
        }

        // 3. Mark invite as accepted (even if duplicate)
        await supaPATCHService(env, "company_invites", invite.id, {
          status: "accepted",
          accepted_at: new Date().toISOString(),
        });

        return jsonResponse(
          { ok: true, company_id: invite.company_id, membership_id: membershipId },
          200,
          acao
        );
      } catch (err) {
        return jsonResponse({ error: "worker_crash", message: String(err) }, 500, acao);
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders(acao) });
  },
};
