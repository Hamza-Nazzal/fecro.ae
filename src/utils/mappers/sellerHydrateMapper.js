// src/utils/mappers/sellerHydrateMapper.js
import { normalizeLocation } from "../location/normalizeLocation";

// Normalizes specifications into array form.
// Supports:
//   • Array: [{ key_label, key_norm?, value, unit? }]
//   • Object: { key_norm: { key_label, value, unit } }
function normalizeSpecsAny(src) {
  if (Array.isArray(src)) return src;
  if (src && typeof src === "object") {
    return Object.entries(src)
      .map(([key_norm, v]) => {
        const keyLabel = (v?.key_label ?? v?.label ?? key_norm ?? "").toString();
        const norm = (key_norm ?? keyLabel).toString();
        const value = v?.value ?? v?.val ?? v?.display ?? "";
        const unit = v?.unit ?? "";
        return { key_label: keyLabel, key_norm: norm, value, unit };
      })
      .filter(
        (s) =>
          (s.key_label || s.key_norm) &&
          (s.value ?? "") !== ""
      );
  }
  return [];
}

function readAny(obj = {}, keys = []) {
  for (const key of keys) {
    if (key in obj && obj[key] != null) return obj[key];
  }
  return undefined;
}

function ensureNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toCamelOrderDetails(src = {}) {
  const base = typeof src === "object" && src ? src : {};
  return {
    incoterms: readAny(base, ["incoterms", "incoterm"]),
    payment: readAny(base, ["payment", "payment_terms", "paymentTerms"]),
    deliveryTime: readAny(base, [
      "deliveryTime",
      "delivery_time",
      "deliveryTimeline",
      "delivery_timeline",
    ]),
  };
}

function mapItem(it = {}) {
  const rawSpecsSource = readAny(it, [
    "specifications",
    "specs",
    "buyerSpecifications",
    "buyer_specifications",
  ]);

  const rawSpecs = Array.isArray(rawSpecsSource)
    ? rawSpecsSource
    : normalizeSpecsAny(rawSpecsSource);
  const buyerSpecsArr = Array.isArray(it.buyerSpecifications)
    ? it.buyerSpecifications
    : Array.isArray(it.buyer_specifications)
    ? it.buyer_specifications
    : [];

  const specifications = rawSpecs.length ? rawSpecs : buyerSpecsArr;

  return {
    productName:
      readAny(it, ["productName", "product_name", "item_name"]) ?? "",
    categoryPath: readAny(it, ["categoryPath", "category_path", "category"]) ?? null,
    barcode: readAny(it, ["barcode", "bar_code"]) ?? null,
    quantity: ensureNumber(readAny(it, ["quantity", "qty", "requested_qty"]), 0),
    purchaseType: readAny(it, ["purchaseType", "purchase_type"]) ?? null,
    specifications,
    buyerSpecifications: buyerSpecsArr,
  };
}

function getSellerRfqIdFromHydrate(dto) {
  if (!dto) return null;
  return readAny(dto, ["sellerRfqId", "seller_rfq_id", "seller_rfqs_id"]) ?? null;
}

function hasLocationValue(loc) {
  if (!loc || typeof loc !== "object") return false;
  return ["city", "state", "country"].some((key) => {
    const value = loc[key];
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });
}

export function mapSellerHydrate(dto, rfqId) {
  const safe = dto ?? {};

  const id = readAny(safe, ["id"]) ?? rfqId;
  const publicId = readAny(safe, ["publicId", "public_id"]);
  const title =
    readAny(safe, ["title", "rfq_title"]) ??
    readAny(safe, ["name", "rfq_name"]) ??
    null;
  const status = readAny(safe, ["status", "rfq_status"]) ?? null;
  const createdAt = readAny(safe, ["createdAt", "created_at"]) ?? null;
  const postedTime =
    readAny(safe, ["postedTime", "posted_time"]) ?? createdAt ?? null;
  const qtyTotal = ensureNumber(readAny(safe, ["qtyTotal", "qty_total"]), 0);
  const categoryPathLast =
    readAny(safe, [
      "categoryPathLast",
      "category_path_last",
      "category_path",
      "category",
    ]) ?? null;

  const orderDetails = toCamelOrderDetails(
    readAny(safe, ["orderDetails", "order_details"])
  );

  const itemsSrc = Array.isArray(safe.items) ? safe.items : [];
  const items = itemsSrc.map(mapItem);

  const buyerCompanyId = readAny(safe, ["buyerCompanyId", "buyer_company_id"]);
  const buyerId = readAny(safe, ["buyerId", "buyer_id"]);

  // Normalize company location from raw DTO fields
  const companyLocationRaw = normalizeLocation({
    city: readAny(safe, [
      "buyerCompanyCity",
      "buyer_company_city",
      "company_city",
    ]),
    country: readAny(safe, [
      "buyerCompanyCountry",
      "buyer_company_country",
      "company_country",
    ]),
    state: readAny(safe, [
      "buyerCompanyState",
      "buyer_company_state",
      "company_state",
      "buyerCompanyEmirate",
      "buyer_company_emirate",
      "company_emirate",
    ]),
  });
  const companyLocation = hasLocationValue(companyLocationRaw) ? companyLocationRaw : null;

  // Normalize RFQ-level location from raw DTO fields
  const rfqLocationRaw = normalizeLocation({
    city: readAny(safe, [
      "locationCity",
      "location_city",
      "rfq_city",
      "city",
    ]),
    country: readAny(safe, [
      "locationCountry",
      "location_country",
      "rfq_country",
      "country",
    ]),
    state: readAny(safe, [
      "locationState",
      "location_state",
      "rfq_state",
      "state",
      "locationEmirate",
      "location_emirate",
      "rfq_emirate",
      "emirate",
    ]),
  });

  // Resolve location with fallback: RFQ-level → Buyer company → null
  const resolvedLocationRaw = normalizeLocation({
    city: rfqLocationRaw.city ?? companyLocationRaw.city ?? null,
    state: rfqLocationRaw.state ?? companyLocationRaw.state ?? null,
    country: rfqLocationRaw.country ?? companyLocationRaw.country ?? null,
  });
  const resolvedLocation = hasLocationValue(resolvedLocationRaw) ? resolvedLocationRaw : null;

  const buyer =
    buyerId || buyerCompanyId || companyLocation
      ? {
          ...(buyerId ? { id: buyerId } : {}),
          ...(buyerCompanyId ? { companyId: buyerCompanyId } : {}),
          ...(companyLocation ? { location: companyLocation } : {}),
        }
      : null;

  return {
    id,
    publicId,
    sellerRfqId: getSellerRfqIdFromHydrate(safe),
    title,
    status,
    createdAt,
    postedTime,
    qtyTotal,
    categoryPathLast,
    orderDetails,
    items,
    buyer,
    companyLocation,
    location: resolvedLocation,
  };
}