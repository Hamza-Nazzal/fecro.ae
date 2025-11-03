// hubgate-api/src/utils/cors.js
export function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
    "vary": "origin",
  };
}

export function allowOrigin(origin, env) {
  const allow = String(env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  return allow.includes(origin) ? origin : "";
}

export function unauthorized(origin = "") {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json", ...corsHeaders(origin) },
  });
}