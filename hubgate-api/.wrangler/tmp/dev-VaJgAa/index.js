var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// .wrangler/tmp/bundle-KrRdCY/checked-fetch.js
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
var urls;
var init_checked_fetch = __esm({
  ".wrangler/tmp/bundle-KrRdCY/checked-fetch.js"() {
    urls = /* @__PURE__ */ new Set();
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_checked_fetch();
    init_modules_watch_stub();
  }
});

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "../../../../../opt/homebrew/lib/node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// src/lib/supabase.js
async function supaPOSTService(env, table, rows) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation"
    },
    body: JSON.stringify(Array.isArray(rows) ? rows : [rows])
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
      accept: "application/json"
    }
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`Supabase GET failed ${res.status}: ${text}`);
  }
  let json;
  try {
    json = text ? JSON.parse(text) : [];
  } catch {
    json = [];
  }
  return { data: json, error: null };
}
async function supaPATCHService(env, table, rowId, patch) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(rowId)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation"
    },
    body: JSON.stringify(patch || {})
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(`Supabase PATCH ${table} failed ${res.status}: ${text}`);
  return { data: Array.isArray(json) ? json : [json], error: null };
}
async function supaGETWithUser(env, table, qs, userJWT) {
  const clean = String(qs || "").replace(/^\?+/, "");
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?${clean}`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${userJWT}`,
      accept: "application/json"
    }
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(`Supabase GET ${table} failed ${res.status}: ${text}`);
  return { status: res.status, json };
}
var init_supabase = __esm({
  "src/lib/supabase.js"() {
    init_checked_fetch();
    init_modules_watch_stub();
    __name(supaPOSTService, "supaPOSTService");
    __name(supaGETService, "supaGETService");
    __name(supaPATCHService, "supaPATCHService");
    __name(supaGETWithUser, "supaGETWithUser");
  }
});

// src/mappers/sellerRfqCardMapper.js
function mapSellerRfqCard(row = {}) {
  if (!row) return null;
  const companyCity = row.company_city ?? null;
  const companyState = row.company_state ?? null;
  const companyCountry = row.company_country ?? null;
  const result = {
    id: row.id ?? null,
    publicId: row.public_id ?? row.id ?? null,
    sellerRfqId: row.seller_rfq_id ?? null,
    title: row.title ?? row.public_id ?? "RFQ",
    status: row.status ?? "active",
    postedAt: row.created_at ?? null,
    categoryPath: row.first_category_path ?? row.category_path ?? "",
    quotationsCount: Number(
      row.quotations_count ?? row.quotes_count ?? row.quotationsCount ?? 0
    ),
    itemsCount: Number(row.items_count ?? 0),
    itemsPreview: Array.isArray(row.items_preview) ? row.items_preview : [],
    itemsSummary: Array.isArray(row.items_summary) ? row.items_summary : [],
    itemsTotalCount: typeof row.items_total_count === "number" ? row.items_total_count : null,
    itemsOverflowCount: typeof row.items_overflow_count === "number" ? row.items_overflow_count : null,
    // Pass through raw fields for backward compatibility
    company_city: companyCity,
    company_state: companyState,
    company_country: companyCountry
  };
  if (companyCity != null || companyState != null || companyCountry != null) {
    result.companyLocation = {
      city: companyCity,
      state: companyState,
      country: companyCountry
    };
  }
  return result;
}
var init_sellerRfqCardMapper = __esm({
  "src/mappers/sellerRfqCardMapper.js"() {
    init_checked_fetch();
    init_modules_watch_stub();
    __name(mapSellerRfqCard, "mapSellerRfqCard");
  }
});

// src/enrichment/enrichRfqCardRows.js
async function fetchQuotationCounts(env, rfqIds = []) {
  if (!Array.isArray(rfqIds) || rfqIds.length === 0) return /* @__PURE__ */ new Map();
  const uniqueIds = [...new Set(rfqIds.filter(Boolean))];
  if (!uniqueIds.length) return /* @__PURE__ */ new Map();
  try {
    const path = `quotations?rfq_id=in.(${uniqueIds.join(",")})&select=rfq_id`;
    const { data } = await supaGETService(env, path);
    const counts = /* @__PURE__ */ new Map();
    for (const row of data || []) {
      const id = row?.rfq_id;
      if (!id) continue;
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    return counts;
  } catch {
    return /* @__PURE__ */ new Map();
  }
}
async function fetchItemsPreviewData(env, rfqIds = []) {
  if (!Array.isArray(rfqIds) || rfqIds.length === 0) {
    return { previewMap: /* @__PURE__ */ new Map(), summaryMap: /* @__PURE__ */ new Map() };
  }
  const uniqueIds = [...new Set(rfqIds.filter(Boolean))];
  if (!uniqueIds.length) return { previewMap: /* @__PURE__ */ new Map(), summaryMap: /* @__PURE__ */ new Map() };
  try {
    const itemsPath = `rfq_items?rfq_id=in.(${uniqueIds.join(",")})&select=id,rfq_id,product_name,quantity,category_path&order=created_at.asc`;
    const { data: items } = await supaGETService(env, itemsPath);
    if (!Array.isArray(items)) return { previewMap: /* @__PURE__ */ new Map(), summaryMap: /* @__PURE__ */ new Map() };
    const itemIds = items.map((it) => it?.id).filter(Boolean);
    const specsByItem = /* @__PURE__ */ new Map();
    if (itemIds.length) {
      try {
        const specsPath = `rfq_item_specs?rfq_item_id=in.(${itemIds.join(",")})&select=rfq_item_id,key_label,key_norm,value,unit`;
        const { data: specs } = await supaGETService(env, specsPath);
        if (Array.isArray(specs)) {
          for (const spec of specs) {
            if (!spec) continue;
            const list = specsByItem.get(spec.rfq_item_id) || [];
            list.push(spec);
            specsByItem.set(spec.rfq_item_id, list);
          }
        }
      } catch {
      }
    }
    const previewMap = /* @__PURE__ */ new Map();
    const summaryMap = /* @__PURE__ */ new Map();
    const itemsCountMap = /* @__PURE__ */ new Map();
    for (const item of items) {
      if (!item?.rfq_id) continue;
      const rfqId = item.rfq_id;
      itemsCountMap.set(rfqId, (itemsCountMap.get(rfqId) || 0) + 1);
    }
    for (const item of items) {
      if (!item?.rfq_id) continue;
      const rfqId = item.rfq_id;
      const specRows = specsByItem.get(item.id) || [];
      const preview = item.product_name?.trim();
      if (preview) {
        const previews = previewMap.get(rfqId) || [];
        if (!previews.includes(preview)) previews.push(preview);
        previewMap.set(rfqId, previews);
      }
      const summaryEntry = {
        name: item.product_name?.trim() || "Item",
        qty: Number(item.quantity) || null,
        categoryPath: item.category_path?.trim() || "",
        specifications: {}
      };
      for (const spec of specRows.slice(0, 10)) {
        const label = (spec.key_label || spec.key_norm || "").trim();
        const value = (spec.value || "").toString().trim();
        if (label && value) {
          const display = spec.unit ? `${value} ${spec.unit}`.trim() : value;
          summaryEntry.specifications[label] = display;
        }
      }
      const summary = summaryMap.get(rfqId) || [];
      if (summary.length < 10) {
        summary.push(summaryEntry);
        summaryMap.set(rfqId, summary);
      }
    }
    return { previewMap, summaryMap, itemsCountMap };
  } catch {
    return { previewMap: /* @__PURE__ */ new Map(), summaryMap: /* @__PURE__ */ new Map() };
  }
}
async function enrichRfqCardRows(env, rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const rfqIds = rows.map((row) => row?.id).filter(Boolean);
  const needsQuotes = rows.some((row) => typeof row?.quotations_count !== "number");
  const needsPreview = rows.some((row) => {
    const arr = Array.isArray(row?.items_preview) ? row.items_preview : [];
    return arr.length === 0;
  });
  const needsSummary = rows.some((row) => {
    const arr = Array.isArray(row?.items_summary) ? row.items_summary : [];
    return arr.length === 0;
  });
  const [quotesMap, itemsData] = await Promise.all([
    needsQuotes ? fetchQuotationCounts(env, rfqIds) : Promise.resolve(/* @__PURE__ */ new Map()),
    needsPreview || needsSummary ? fetchItemsPreviewData(env, rfqIds) : Promise.resolve({ previewMap: /* @__PURE__ */ new Map(), summaryMap: /* @__PURE__ */ new Map() })
  ]);
  const previewMap = itemsData?.previewMap instanceof Map ? itemsData.previewMap : /* @__PURE__ */ new Map();
  const summaryMap = itemsData?.summaryMap instanceof Map ? itemsData.summaryMap : /* @__PURE__ */ new Map();
  const itemsCountMap = itemsData?.itemsCountMap instanceof Map ? itemsData.itemsCountMap : /* @__PURE__ */ new Map();
  return rows.map((row) => {
    const next = { ...row };
    const id = row?.id;
    if (typeof next.quotations_count !== "number" && id && quotesMap.has(id)) {
      next.quotations_count = quotesMap.get(id);
    }
    if (!Array.isArray(next.items_preview) || next.items_preview.length === 0) {
      next.items_preview = id && previewMap.has(id) ? previewMap.get(id) : [];
    }
    if (!Array.isArray(next.items_summary) || next.items_summary.length === 0) {
      const fallbackCategoryPath = row?.first_category_path ?? row?.category_path ?? "";
      const fetched = id && summaryMap.has(id) ? summaryMap.get(id) : [];
      const enriched = fetched.map((entry) => ({
        ...entry,
        categoryPath: entry.categoryPath || fallbackCategoryPath
      }));
      next.items_summary = enriched;
    }
    if (id && itemsCountMap.has(id)) {
      const totalItems = itemsCountMap.get(id);
      const shownItems = Array.isArray(next.items_summary) ? next.items_summary.length : 0;
      const overflowCount = Math.max(0, totalItems - shownItems);
      next.items_total_count = totalItems;
      if (overflowCount > 0) {
        next.items_overflow_count = overflowCount;
      }
    }
    return next;
  });
}
var init_enrichRfqCardRows = __esm({
  "src/enrichment/enrichRfqCardRows.js"() {
    init_checked_fetch();
    init_modules_watch_stub();
    init_supabase();
    __name(fetchQuotationCounts, "fetchQuotationCounts");
    __name(fetchItemsPreviewData, "fetchItemsPreviewData");
    __name(enrichRfqCardRows, "enrichRfqCardRows");
  }
});

// src/mappers/sellerHydrateMapper.js
var init_sellerHydrateMapper = __esm({
  "src/mappers/sellerHydrateMapper.js"() {
    init_checked_fetch();
    init_modules_watch_stub();
  }
});

// src/services/sellerRfqService.js
var sellerRfqService_exports = {};
__export(sellerRfqService_exports, {
  fetchSellerRfqList: () => fetchSellerRfqList,
  hydrateSellerRfq: () => hydrateSellerRfq
});
async function fetchSellerRfqList(env, bearerToken, queryString) {
  try {
    const { status, json } = await supaGETWithUser(
      env,
      "v_rfqs_card",
      queryString,
      bearerToken
    );
    if (status >= 400) {
      return { error: { status, details: json } };
    }
    const rows = Array.isArray(json) ? json : [];
    const enriched = await enrichRfqCardRows(env, rows);
    const mapped = enriched.map(mapSellerRfqCard);
    return { rows: mapped };
  } catch (e) {
    return { error: { message: String(e) } };
  }
}
async function hydrateSellerRfq(env, bearer, rfqId, sellerId) {
  const url = `${env.SUPABASE_URL}/rest/v1/rpc/rfq_hydrate_seller`;
  const payload = {
    _rfq_id: rfqId,
    _seller_id: sellerId
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "apikey": env.SUPABASE_SERVICE_ROLE,
      "Authorization": `Bearer ${bearer}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    return { error: { status: res.status, body: json } };
  }
  const mapped = (void 0)(json);
  return { data: mapped };
}
var init_sellerRfqService = __esm({
  "src/services/sellerRfqService.js"() {
    init_checked_fetch();
    init_modules_watch_stub();
    init_supabase();
    init_sellerRfqCardMapper();
    init_enrichRfqCardRows();
    init_sellerHydrateMapper();
    __name(fetchSellerRfqList, "fetchSellerRfqList");
    __name(hydrateSellerRfq, "hydrateSellerRfq");
  }
});

// .wrangler/tmp/bundle-KrRdCY/middleware-loader.entry.ts
init_checked_fetch();
init_modules_watch_stub();

// .wrangler/tmp/bundle-KrRdCY/middleware-insertion-facade.js
init_checked_fetch();
init_modules_watch_stub();

// src/index.js
init_checked_fetch();
init_modules_watch_stub();

// src/utils/response.js
init_checked_fetch();
init_modules_watch_stub();

// src/utils/cors.js
init_checked_fetch();
init_modules_watch_stub();
function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
    "vary": "origin"
  };
}
__name(corsHeaders, "corsHeaders");
function allowOrigin(origin, env) {
  const allow = String(env.CORS_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return allow.includes(origin) ? origin : "";
}
__name(allowOrigin, "allowOrigin");
function unauthorized(origin = "") {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json", ...corsHeaders(origin) }
  });
}
__name(unauthorized, "unauthorized");

// src/utils/response.js
function ok(data, extra = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...extra
    }
  });
}
__name(ok, "ok");
function jsonResponse(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(origin) }
  });
}
__name(jsonResponse, "jsonResponse");

// src/lib/auth.js
init_checked_fetch();
init_modules_watch_stub();
async function requireAdmin(req, env) {
  const hdr = req.headers.get("authorization") || "";
  const token = hdr.toLowerCase().startsWith("bearer ") ? hdr.slice(7) : "";
  return token && token === env.ADMIN_BEARER;
}
__name(requireAdmin, "requireAdmin");
async function getCompanyIdForUser(env, userId) {
  const url = `${env.SUPABASE_URL}/rest/v1/company_memberships?user_id=eq.${userId}&select=company_id&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      accept: "application/json"
    }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0].company_id : null;
}
__name(getCompanyIdForUser, "getCompanyIdForUser");
async function requireUser(req, env, acao = "") {
  const hdr = req.headers.get("authorization") || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (!token) {
    return {
      ok: false,
      res: new Response(JSON.stringify({ error: "missing_bearer" }), {
        status: 401,
        headers: {
          "content-type": "application/json",
          ...corsHeaders(acao)
        }
      })
    };
  }
  const r = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${token}` }
  });
  if (!r.ok) {
    return {
      ok: false,
      res: new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 401,
        headers: {
          "content-type": "application/json",
          ...corsHeaders(acao)
        }
      })
    };
  }
  const user = await r.json();
  const company_id = await getCompanyIdForUser(env, user.id);
  if (company_id) user.company_id = company_id;
  return { ok: true, user };
}
__name(requireUser, "requireUser");
async function inviteUserByEmail(env, email, roles = []) {
  const url = `${env.SUPABASE_URL}/auth/v1/invite`;
  const body = JSON.stringify({
    email,
    data: { roles },
    // stored as user_metadata.roles
    redirect_to: "https://api.hubgate.ae/auth/redirect"
  });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: env.SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
    },
    body
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, body: json };
}
__name(inviteUserByEmail, "inviteUserByEmail");

// src/handlers/seller.js
init_checked_fetch();
init_modules_watch_stub();
init_supabase();
init_sellerRfqService();
async function listSellerRFQs(req, env, acao) {
  const authCheck = await requireUser(req, env);
  if (!authCheck.ok) return authCheck.res;
  const sellerCompanyId = authCheck.user.company_id;
  if (!sellerCompanyId) {
    return jsonResponse(
      { error: "missing_company_id", message: "User must be associated with a company" },
      403,
      acao
    );
  }
  const url = new URL(req.url);
  try {
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
      "company_city",
      "company_state",
      "company_country"
    ].join(",");
    const qp = new URLSearchParams();
    qp.set("select", selectCols);
    qp.set("status", "eq.active");
    qp.set("buyer_company_id", `neq.${sellerCompanyId}`);
    qp.set("order", "created_at.desc");
    qp.set("limit", String(pageSize));
    qp.set("offset", String(offset));
    const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!bearer) {
      return jsonResponse({ error: "unauthorized" }, 401, acao);
    }
    const result = await fetchSellerRfqList(env, bearer, qp.toString());
    if (result.error) {
      console.error("Seller RFQ service error:", result.error);
      return jsonResponse(
        { error: "upstream_error", details: result.error },
        result.error.status || 500,
        acao
      );
    }
    return ok(
      {
        page,
        pageSize,
        count: result.rows.length,
        rows: result.rows
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
__name(listSellerRFQs, "listSellerRFQs");
async function hydrateSellerRFQ(req, env, acao) {
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
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!bearer) {
    return jsonResponse({ error: "unauthorized" }, 401, acao);
  }
  try {
    const { hydrateSellerRfq: hydrateSellerRfq2 } = await Promise.resolve().then(() => (init_sellerRfqService(), sellerRfqService_exports));
    const result = await hydrateSellerRfq2(env, bearer, id, sellerId);
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
__name(hydrateSellerRFQ, "hydrateSellerRFQ");

// src/handlers/company.js
init_checked_fetch();
init_modules_watch_stub();
init_supabase();
async function createCompany(req, env, acao) {
  const authCheck = await requireUser(req, env, acao);
  if (!authCheck.ok) return authCheck.res;
  const user = authCheck.user;
  const payload = await req.json().catch(() => ({}));
  const name = (payload?.name || "").trim();
  if (!name) {
    return jsonResponse({ error: "name_required" }, 400, acao);
  }
  const legalName = (payload?.legalName || "").trim() || null;
  const tradeLicenseNo = (payload?.tradeLicenseNo || "").trim() || null;
  const country = (payload?.country || "").trim() || null;
  const city = payload?.city || null;
  const phone = (payload?.phone || "").trim() || null;
  try {
    const companyData = {
      name,
      legal_name: legalName,
      trade_license_no: tradeLicenseNo,
      country,
      city,
      phone,
      created_by_user_id: user.id
    };
    Object.keys(companyData).forEach(
      (key) => companyData[key] === null && delete companyData[key]
    );
    const [company] = await supaPOSTService(env, "companies", companyData);
    const [m] = await supaPOSTService(env, "company_memberships", {
      company_id: company.id,
      user_id: user.id,
      track: "procurement",
      role_level: 10
    });
    return ok(
      { companyId: company.id, name: company.name ?? name, membershipId: m.id },
      corsHeaders(acao)
    );
  } catch (e) {
    console.error("company/create crash:", e?.stack || e?.message || e);
    return jsonResponse({ error: "worker_crash", message: String(e) }, 500, acao);
  }
}
__name(createCompany, "createCompany");
async function inviteCompanyUser(req, env, acao) {
  const authCheck = await requireUser(req, env, acao);
  if (!authCheck.ok) return authCheck.res;
  const user = authCheck.user;
  const { email } = await req.json().catch(() => ({}));
  if (!email) return jsonResponse({ error: "missing_email" }, 400, acao);
  const token = crypto.randomUUID();
  try {
    const result = await supaPOSTService(env, "company_invites", {
      company_id: user.company_id,
      email,
      invited_by: user.id,
      token
    });
    const invite = Array.isArray(result) ? result[0] : result;
    return jsonResponse({ ok: true, invite }, 200, acao);
  } catch (err) {
    return jsonResponse(
      { error: "invite_create_failed", details: err.message || String(err) },
      500,
      acao
    );
  }
}
__name(inviteCompanyUser, "inviteCompanyUser");
async function acceptCompanyInvite(req, env, acao) {
  const authCheck = await requireUser(req, env, acao);
  if (!authCheck.ok) return authCheck.res;
  const user = authCheck.user;
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body.token || "").trim();
    if (!token) return jsonResponse({ error: "missing_token" }, 400, acao);
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
    let membershipId;
    try {
      const [membership] = await supaPOSTService(env, "company_memberships", {
        company_id: invite.company_id,
        user_id: user.id,
        track: "sales",
        role_level: 10
      });
      membershipId = membership.id;
    } catch (e) {
      const msg = String(e.message || e);
      const isDuplicate = msg.includes('"code":"23505"') || msg.includes("company_memberships_company_id_user_id_key");
      if (!isDuplicate) throw e;
      const { data: existing } = await supaGETService(
        env,
        `company_memberships?company_id=eq.${encodeURIComponent(invite.company_id)}&user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`
      );
      membershipId = existing?.[0]?.id || null;
    }
    await supaPATCHService(env, "company_invites", invite.id, {
      status: "accepted",
      accepted_at: (/* @__PURE__ */ new Date()).toISOString()
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
__name(acceptCompanyInvite, "acceptCompanyInvite");
async function getMe(req, env, acao) {
  const authCheck = await requireUser(req, env, acao);
  if (!authCheck.ok) return authCheck.res;
  const user = authCheck.user;
  return jsonResponse(
    {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      },
      company_id: user.company_id || null
    },
    200,
    acao
  );
}
__name(getMe, "getMe");
async function getCompanyInvite(req, env, acao) {
  try {
    const url = new URL(req.url);
    const token = url.pathname.split("/").pop();
    if (!token || token === "invite") {
      return jsonResponse({ error: "missing_token" }, 400, acao);
    }
    const { data: invites, error: fetchErr } = await supaGETService(
      env,
      `company_invites?token=eq.${encodeURIComponent(token)}&select=email,company_id,status`
    );
    if (fetchErr) throw new Error(fetchErr.message);
    const invite = Array.isArray(invites) && invites.length > 0 ? invites[0] : null;
    if (!invite) {
      return jsonResponse({ error: "invalid_or_expired" }, 404, acao);
    }
    let companyName = null;
    if (invite.company_id) {
      const { data: companies, error: companyErr } = await supaGETService(
        env,
        `companies?id=eq.${encodeURIComponent(invite.company_id)}&select=name&limit=1`
      );
      if (!companyErr && Array.isArray(companies) && companies.length > 0) {
        companyName = companies[0].name;
      }
    }
    return jsonResponse(
      {
        email: invite.email,
        companyName,
        status: invite.status
      },
      200,
      acao
    );
  } catch (err) {
    return jsonResponse({ error: "worker_crash", message: String(err) }, 500, acao);
  }
}
__name(getCompanyInvite, "getCompanyInvite");

// src/handlers/buyerRfq.js
init_checked_fetch();
init_modules_watch_stub();
init_supabase();
async function listBuyerRFQs(req, env, acao) {
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
      "company_country"
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
__name(listBuyerRFQs, "listBuyerRFQs");
async function getBuyerRFQ(req, env, acao) {
  const authCheck = await requireUser(req, env);
  if (!authCheck.ok) return authCheck.res;
  const url = new URL(req.url);
  const pathname = url.pathname || "";
  const parts = pathname.split("/").filter(Boolean);
  const rfqId = parts[2];
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
      "company_country"
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
__name(getBuyerRFQ, "getBuyerRFQ");

// src/index.js
var src_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || "";
    const acao = allowOrigin(origin, env);
    console.log("PATH=", url.pathname);
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(acao) });
    }
    if (url.pathname === "/api/health" || url.pathname === "/health" || url.pathname === "/healthz") {
      return ok({ ok: true, service: "hubgate-api", ts: Date.now() }, corsHeaders(acao));
    }
    if (url.pathname === "/auth/redirect") {
      const forward = new URL("https://app.hubgate.ae/auth/callback");
      for (const [k, v] of url.searchParams) forward.searchParams.set(k, v);
      return Response.redirect(forward.toString(), 302);
    }
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
          headers: { "content-type": "application/json", ...corsHeaders(acao) }
        });
      }
      const { status, body } = await inviteUserByEmail(env, email, roles);
      return new Response(JSON.stringify({ status, result: body }), {
        status,
        headers: { "content-type": "application/json", ...corsHeaders(acao) }
      });
    }
    if (url.pathname === "/admin/debug/supabase-host" && req.method === "GET") {
      const isAdmin = await requireAdmin(req, env);
      if (!isAdmin) return unauthorized(acao);
      let host = "BAD_URL";
      try {
        host = new URL(env.SUPABASE_URL).host;
      } catch {
      }
      return ok({ supabaseHost: host }, corsHeaders(acao));
    }
    if (url.pathname === "/buyer/rfqs" && req.method === "GET") {
      return listBuyerRFQs(req, env, acao);
    }
    if (url.pathname.startsWith("/buyer/rfq/") && req.method === "GET") {
      return getBuyerRFQ(req, env, acao);
    }
    if (url.pathname === "/seller/rfqs" && req.method === "GET") {
      return listSellerRFQs(req, env, acao);
    }
    if (url.pathname === "/seller/rfq/hydrate" && req.method === "GET") {
      return hydrateSellerRFQ(req, env, acao);
    }
    if (url.pathname === "/company/create" && req.method === "POST") {
      return createCompany(req, env, acao);
    }
    if (url.pathname === "/company/invite" && req.method === "POST") {
      return inviteCompanyUser(req, env, acao);
    }
    if (url.pathname === "/company/accept" && req.method === "POST") {
      return acceptCompanyInvite(req, env, acao);
    }
    if (url.pathname.startsWith("/company/invite/") && req.method === "GET") {
      return getCompanyInvite(req, env, acao);
    }
    if (url.pathname === "/me" && req.method === "GET") {
      return getMe(req, env, acao);
    }
    return new Response("Not Found", { status: 404, headers: corsHeaders(acao) });
  }
};

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_checked_fetch();
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_checked_fetch();
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-KrRdCY/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
init_checked_fetch();
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-KrRdCY/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
