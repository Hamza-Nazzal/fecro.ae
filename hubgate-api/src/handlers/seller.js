// hubgate-api/src/handlers/seller.js
import { requireUser } from "../lib/auth.js";
import { supaGETWithUser } from "../lib/supabase.js";
import { fetchSellerRfqList } from "../services/sellerRfqService.js";
import { ok, jsonResponse } from "../utils/response.js";
import { corsHeaders } from "../utils/cors.js";

export async function listSellerRFQs(req, env, acao) {
  // Auth check (same pattern as buyerRfq.js)
  const authCheck = await requireUser(req, env);
  if (!authCheck.ok) return authCheck.res;
  const sellerCompanyId = authCheck.user.company_id;

  // Validate that sellerCompanyId exists
  if (!sellerCompanyId) {
    return jsonResponse(
      { error: "missing_company_id", message: "User must be associated with a company" },
      403,
      acao
    );
  }

  const url = new URL(req.url);

  try {
    // Extract pagination params
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("pageSize") || 20)));
    const offset = (page - 1) * pageSize;

    // Build select columns (only columns that exist in v_rfqs_card view)
    // items_preview, items_summary, and quotations_count don't exist in the view - enrichment will fetch them
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
      "company_city",
      "company_state",
      "company_country",
    ].join(",");

    // Build query string (URLSearchParams, not object)
    const qp = new URLSearchParams();
    qp.set("select", selectCols);
    qp.set("status", "eq.active"); // Only active RFQs for sellers
    qp.set("buyer_company_id", `neq.${sellerCompanyId}`);
    qp.set("order", "created_at.desc");
    qp.set("limit", String(pageSize));
    qp.set("offset", String(offset));

    // Extract bearer token from request headers
    const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!bearer) {
      return jsonResponse({ error: "unauthorized" }, 401, acao);
    }

    // Call service with query string and bearer token
    const result = await fetchSellerRfqList(env, bearer, qp.toString());

    if (result.error) {
      console.error("Seller RFQ service error:", result.error);
      return jsonResponse(
        { error: "upstream_error", details: result.error },
        result.error.status || 500,
        acao
      );
    }

    // Return success response
    return ok(
      {
        page,
        pageSize,
        count: result.rows.length,
        rows: result.rows,
      },
      corsHeaders(acao)
    );
  } catch (e) {
    console.error("seller/rfqs crash:", e && (e.stack || e.message || e));
    return jsonResponse(
      { error: "worker_crash", message: String(e) },
      500,
      acao
    );
  }
}

export async function hydrateSellerRFQ(req, env, acao) {
  // 1) Auth
  const authCheck = await requireUser(req, env);
  if (!authCheck.ok) return authCheck.res;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const sellerId = url.searchParams.get("sellerId");

  if (!id || !sellerId) {
    return jsonResponse(
      { error: "missing_parameters", details: { id, sellerId } },
      400,
      acao
    );
  }

  // Extract bearer token
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!bearer) {
    return jsonResponse({ error: "unauthorized" }, 401, acao);
  }

  // 2) Call service
  try {
    const { hydrateSellerRfq } = await import("../services/sellerRfqService.js");

    const result = await hydrateSellerRfq(env, bearer, id, sellerId);

    if (result.error) {
      console.error("hydrateSellerRFQ error:", result.error);
      return jsonResponse(
        { error: "upstream_error", details: result.error },
        result.error.status || 500,
        acao
      );
    }

    return ok(result.data, corsHeaders(acao));
  } catch (e) {
    console.error("hydrateSellerRFQ crash:", e);
    return jsonResponse(
      { error: "worker_crash", message: String(e) },
      500,
      acao
    );
  }
}