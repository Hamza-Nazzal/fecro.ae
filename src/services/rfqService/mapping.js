// src/services/rfqService/mapping.js
import { rfqDbToJs } from "../../utils/mappers";
import {
  sanitizeItemsPreview,
  sanitizeItemsSummary,
  sanitizeQuotationsCount,
  getSellerRfqId,
} from '../../utils/rfq/sanitizers';
import { normalizeLocation } from "../../utils/location/normalizeLocation";

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
      .filter(s => (s.key_label || s.key_norm) && (s.value ?? "") !== "");
  }
  return [];
}


/** Convert rfq_item_specs[] → { key_norm: { key_norm, key_label, value, unit } } */
function specRowsToObject(rows = []) {
  const out = {};
  for (const r of rows || []) {
    if (!r) continue;
    const key_norm = (r.key_norm || "").toString().trim();
    const value = (r.value ?? "").toString().trim();
    if (!key_norm || !value) continue;
    const unit = (r.unit ?? "").toString().trim() || null;
    const key_label = (r.key_label ?? r.key_norm ?? "").toString().trim() || key_norm;
    out[key_norm] = {
      key_norm,
      key_label,
      value,
      unit,
    };
  }
  return out;
}

function mapItemRow(row = {}) {
  const srcSpecs =
    Array.isArray(row.specifications)
      ? row.specifications
      : normalizeSpecsAny(row.specifications);

  const buyerSpecs = Array.isArray(row.buyerSpecifications)
    ? row.buyerSpecifications
    : [];

  const rfqItemSpecs = Array.isArray(row.rfq_item_specs)
    ? row.rfq_item_specs
    : [];

  const specsFallback =
    srcSpecs.length
      ? srcSpecs
      : buyerSpecs.length
      ? buyerSpecs
      : rfqItemSpecs.length
      ? rfqItemSpecs
      : [];

  return {
    id: row.id ?? null,
    rfqId: row.rfq_id ?? null,
    productName: row.product_name ?? "",
    category: row.category ?? "",
    categoryPath: row.category_path ?? "",
    barcode: row.barcode ?? "",
    quantity: row.quantity ?? "",
    purchaseType: row.purchase_type ?? "one-time",
    specifications: specsFallback,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

/** Final UI shape: rfq (mapped) + items[] mapped */
export function mapRFQRow(row = {}) {
  const base = rfqDbToJs(row);
  base.items = Array.isArray(row.rfq_items) ? row.rfq_items.map(mapItemRow) : [];
  base.itemsSummary = Array.isArray(row.items_summary) ? row.items_summary : [];


  const first = base.items?.[0] || {};
  if (base.quantity == null) base.quantity = first.quantity ?? null;
  if (!base.categoryPath) base.categoryPath = first.category_path ?? null;
  if (!base.category) base.category = first.category ?? null;

  
  return base;
}

export function rfqCardDbToJs(row) {
  const sellerRfqId = getSellerRfqId(row);
  const base = {
    id: row?.id,
    publicId: row?.public_id ?? row?.id,
    sellerRfqId: sellerRfqId,
    title: row?.title ?? "Untitled RFQ",
    status: row?.status ?? "active",               // your data uses 'active'
    postedAt: row?.created_at ?? null,
    deadline: null,                                 // not in your view
    buyerId: row?.buyer_id ?? null,
    buyer: row?.buyer_id ? { id: row.buyer_id } : null,
    views: 0,                                       // not in your view
    quotationsCount: sanitizeQuotationsCount(
      typeof row?.quotations_count === "number"
        ? row.quotations_count
        : typeof row?.quotes_count === "number"
        ? row.quotes_count
        : row?.quotationsCount
    ),
    items: [],                                      // not in your view
    itemsPreview: sanitizeItemsPreview(
      Array.isArray(row?.items_preview) ? row.items_preview : row?.itemsPreview
    ),
    itemsSummary: sanitizeItemsSummary(
      Array.isArray(row?.items_summary) ? row.items_summary : row?.itemsSummary,
      row?.first_category_path ??
        row?.category_path ??
        row?.categoryPath ??
        row?.category ??
        row?.categories?.path_text ??
        ""
    ),
    categoryPath: row?.first_category_path ?? "",
    notes: null,
    qtyTotal: row?.qty_total ?? null,
  };

  // Normalize RFQ-level location
  const rfqLocation = normalizeLocation({
    city: row?.rfq_city ?? row?.location_city ?? row?.city,
    country: row?.rfq_country ?? row?.location_country ?? row?.country,
    state: row?.state ?? row?.rfq_state ?? row?.location_state ??
           row?.rfq_emirate ?? row?.location_emirate ?? row?.emirate,
  });

  // Normalize company location
  const companyLocation = normalizeLocation({
    city: row?.company_city ?? row?.buyer_company_city ?? row?.companyCity ?? row?.buyerCompanyCity,
    country: row?.company_country ?? row?.buyer_company_country ?? row?.companyCountry ?? row?.buyerCompanyCountry,
    state: row?.company_state ?? row?.buyer_company_state ?? row?.companyState ?? row?.buyerCompanyState ??
           row?.company_emirate ?? row?.buyer_company_emirate ?? row?.companyEmirate ?? row?.buyerCompanyEmirate,
  });

  // Resolve location with fallback: RFQ-level → Buyer company
  const resolvedLocation = normalizeLocation({
    city: rfqLocation.city ?? companyLocation.city ?? null,
    state: rfqLocation.state ?? companyLocation.state ?? null,
    country: rfqLocation.country ?? companyLocation.country ?? null,
  });

  // Always set location object (never null)
  base.location = resolvedLocation;

  // Set companyLocation if it has any values
  if (companyLocation.city || companyLocation.state || companyLocation.country) {
    base.companyLocation = companyLocation;
  }

  const buyerCompanyId = row?.buyer_company_id ?? null;
  const buyerId = row?.buyer_id ?? null;
  const buyerBase =
    typeof base.buyer === "object" && base.buyer !== null ? { ...base.buyer } : {};

  if (buyerId) {
    buyerBase.id = buyerId;
  }
  if (buyerCompanyId) {
    buyerBase.companyId = buyerCompanyId;
  }
  if (base.companyLocation && (base.companyLocation.city || base.companyLocation.state || base.companyLocation.country)) {
    buyerBase.location = normalizeLocation({
      city: buyerBase.location?.city ?? base.companyLocation.city ?? null,
      state: buyerBase.location?.state ?? base.companyLocation.state ?? null,
      country: buyerBase.location?.country ?? base.companyLocation.country ?? null,
    });
  }

  if (Object.keys(buyerBase).length) {
    base.buyer = buyerBase;
  }

  return base;
}