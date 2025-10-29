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

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json", ...corsHeaders(acao)  },
  });
}

async function requireAdmin(req, env) {
  const hdr = req.headers.get("authorization") || "";
  const token = hdr.toLowerCase().startsWith("bearer ") ? hdr.slice(7) : "";
  return token && token === env.ADMIN_BEARER;
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
    if (url.pathname === "/healthz") {
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
      if (!isAdmin) return unauthorized();

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

    return new Response("Not Found", { status: 404, headers: corsHeaders(acao) });
  },
};

