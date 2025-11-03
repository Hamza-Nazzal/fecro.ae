// hubgate-api/src/lib/supabase.js

export async function supaPOSTService(env, table, rows) {
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

export async function supaGETService(env, path) {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;

  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      accept: "application/json",
    },
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`Supabase GET failed ${res.status}: ${text}`);
  }

  let json;
  try { json = text ? JSON.parse(text) : []; } catch { json = []; }
  return { data: json, error: null };
}

export async function supaPATCHService(env, table, rowId, patch) {
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
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }

  if (!res.ok) throw new Error(`Supabase PATCH ${table} failed ${res.status}: ${text}`);

  return { data: Array.isArray(json) ? json : [json], error: null };
}

export async function supaGETWithUser(env, table, qs, userJWT) {
  const clean = String(qs || "").replace(/^\?+/, "");
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?${clean}`;

  // console.log("POSTGREST GET:", url);

  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${userJWT}`,
      accept: "application/json",
    },
  });

  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }

  if (!res.ok) throw new Error(`Supabase GET ${table} failed ${res.status}: ${text}`);

  return { status: res.status, json };
}