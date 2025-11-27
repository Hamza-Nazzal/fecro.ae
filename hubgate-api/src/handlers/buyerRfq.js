// hubgate-api/src/handlers/buyerRfq.js

import { requireUser } from "../lib/auth";
import { supaGETWithUser } from "../lib/supabase";
import { ok, jsonResponse } from "../utils/response";
import { corsHeaders } from "../utils/cors";

// GET /buyer/rfqs
export async function listBuyerRFQs(req, env, acao) {
  const authCheck = await requireUser(req, env);
  if (!authCheck.ok) return authCheck.res;

  const url = new URL(req.url);

  try {
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.max(
      1,
      Math.min(100, Number(url.searchParams.get("pageSize") || 20))
    );
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
      "company_city",
      "company_state",
      "company_country",
    ].join(",");

    const qp = new URLSearchParams();
    qp.set("select", selectCols);
    qp.set("status", "eq.active");
    qp.set("order", "created_at.desc");
    qp.set("limit", String(pageSize));
    qp.set("offset", String(offset));

    const bearer = (req.headers.get("authorization") || "").replace(
      /^Bearer\s+/i,
      ""
    );
    if (!bearer) {
      return jsonResponse({ error: "unauthorized" }, 401, acao);
    }

    const { status, json } = await supaGETWithUser(
      env,
      "v_rfqs_card",
      qp.toString(),
      bearer
    );

    if (status >= 400) {
      console.error("Supabase REST error (buyer/rfqs)", status, json);
      return jsonResponse(
        { error: "upstream_error", status, details: json },
        status,
        acao
      );
    }

    const rows = Array.isArray(json) ? json : [];
    return ok(
      { page, pageSize, count: rows.length, rows },
      corsHeaders(acao)
    );
  } catch (e) {
    console.error("buyer/rfqs crash:", e && (e.stack || e.message || e));
    return jsonResponse(
      { error: "worker_crash", message: String(e) },
      500,
      acao
    );
  }
}

// GET /buyer/rfq/:id  (id = internal RFQ UUID, like existing buyer detail)
export async function getBuyerRFQ(req, env, acao) {
  const authCheck = await requireUser(req, env);
  if (!authCheck.ok) return authCheck.res;

  const url = new URL(req.url);
  const pathname = url.pathname || "";
  const parts = pathname.split("/").filter(Boolean);
  const rfqId = parts[2]; // /buyer/rfq/:id → ["buyer","rfq",":id"]

  if (!rfqId) {
    return jsonResponse({ error: "missing_rfq_id" }, 400, acao);
  }

  try {
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
      "company_city",
      "company_state",
      "company_country",
    ].join(",");

    const qp = new URLSearchParams();
    qp.set("select", selectCols);
    qp.set("id", `eq.${rfqId}`);
    qp.set("limit", "1");

    const bearer = (req.headers.get("authorization") || "").replace(
      /^Bearer\s+/i,
      ""
    );
    if (!bearer) {
      return jsonResponse({ error: "unauthorized" }, 401, acao);
    }

    const { status, json } = await supaGETWithUser(
      env,
      "v_rfqs_card",
      qp.toString(),
      bearer
    );

    if (status >= 400) {
      console.error("Supabase REST error (buyer/rfq)", status, json);
      return jsonResponse(
        { error: "upstream_error", status, details: json },
        status,
        acao
      );
    }

    const rows = Array.isArray(json) ? json : [];
    const rfq = rows[0] || null;

    if (!rfq) {
      return jsonResponse({ error: "not_found" }, 404, acao);
    }

    return jsonResponse({ rfq }, 200, acao);
  } catch (e) {
    console.error("buyer/rfq crash:", e && (e.stack || e.message || e));
    return jsonResponse(
      { error: "worker_crash", message: String(e) },
      500,
      acao
    );
  }
}