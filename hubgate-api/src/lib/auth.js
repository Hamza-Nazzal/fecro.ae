// hubgate-api/src/lib/auth.js

// Base64URL → string (keep if still needed elsewhere)
export function b64urlToStr(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  if (pad) s += "=".repeat(pad);
  return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));
}

export async function requireAdmin(req, env) {
  const hdr = req.headers.get("authorization") || "";
  const token = hdr.toLowerCase().startsWith("bearer ") ? hdr.slice(7) : "";
  return token && token === env.ADMIN_BEARER;
}

export async function getCompanyIdForUser(env, userId) {
  const url = `${env.SUPABASE_URL}/rest/v1/company_memberships?user_id=eq.${userId}&select=company_id&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0].company_id : null;
}

export async function requireUser(req, env) {
  const hdr = req.headers.get("authorization") || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (!token) {
    return {
      ok: false,
      res: new Response(JSON.stringify({ error: "missing_bearer" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    };
  }
  // Validate token with Supabase Auth using the ANON key
  const r = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    return {
      ok: false,
      res: new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    };
  }
  const user = await r.json();

  // Attach company_id from company_memberships (via service key)
  const company_id = await getCompanyIdForUser(env, user.id);
  if (company_id) user.company_id = company_id;

  return { ok: true, user };
}

export function hasSellerRole(user) {
  const roles =
    user?.user_metadata?.roles ||
    user?.app_metadata?.roles ||
    [];
  return Array.isArray(roles) && roles.includes("seller");
}

export async function inviteUserByEmail(env, email, roles = []) {
  const url = `${env.SUPABASE_URL}/auth/v1/invite`;
  const body = JSON.stringify({
    email,
    data: { roles }, // stored as user_metadata.roles
    redirect_to: "https://api.hubgate.ae/auth/redirect",
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
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, body: json };
}

export async function getUserIdFromJWT(req, env) {
  const hdr = req.headers.get("authorization") || "";
  if (!/^bearer\s+/i.test(hdr)) return null;
  const token = hdr.slice(7);
  const resp = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY, // service or anon both fine here
      authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  return json?.id || null;
}

