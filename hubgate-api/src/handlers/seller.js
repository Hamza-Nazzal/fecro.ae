// hubgate-api/src/handlers/seller.js
import { ok } from "../utils/response.js";
import { corsHeaders } from "../utils/cors.js";
import { hasSellerRole, requireUser } from "../lib/auth.js";
import { supaGETWithUser } from "../lib/supabase.js";

export async function listSellerRFQs(req, env, acao) {
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
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("pageSize") || 20)));
    const offset = (page - 1) * pageSize;

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

    const qp = new URLSearchParams();
    qp.set("select", selectCols);
    qp.set("status", "eq.active");
    qp.set("order", "created_at.desc");
    qp.set("limit", String(pageSize));
    qp.set("offset", String(offset));

    const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!bearer) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: corsHeaders(acao),
      });
    }

    const { status, json } = await supaGETWithUser(env, "v_rfqs_card", qp.toString(), bearer);
    if (status >= 400) {
      console.error("Supabase REST error", status, json);
      return new Response(JSON.stringify({ error: "upstream_error", status, details: json }), {
        status,
        headers: { "content-type": "application/json", ...corsHeaders(acao) },
      });
    }

    const rows = Array.isArray(json) ? json : [];
    return ok({ page, pageSize, count: rows.length, rows }, corsHeaders(acao));
  } catch (e) {
    console.error("seller/rfqs crash:", e?.stack || e?.message || e);
    return new Response(JSON.stringify({ error: "worker_crash", message: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders(acao) },
    });
  }
}