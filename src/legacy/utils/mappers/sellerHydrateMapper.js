// src/utils/mappers/sellerHydrateMapper.js

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

function getSellerRfqIdFromHydrate(dto) {
  return dto?.seller_rfq_id || null;
}

export function mapSellerHydrate(dto, rfqId) {
  const safe = dto ?? {};
  const items = Array.isArray(safe.items) ? safe.items : [];
  const od = safe.orderDetails || {};
  const sellerRfqId = getSellerRfqIdFromHydrate(safe);
  
  return {
    id: safe.id ?? rfqId,
    publicId: safe.publicId ?? null,
    sellerRfqId: sellerRfqId,
    title: safe.title ?? null,
    status: safe.status ?? null,
    createdAt: safe.createdAt ?? null,
    postedTime: safe.postedTime ?? null,
    qtyTotal: Number(safe.qtyTotal ?? 0),
    categoryPathLast: safe.categoryPathLast ?? null,
    orderDetails: {
      incoterms: od.incoterms ?? null,
      payment: od.payment ?? null,
      deliveryTime: od.deliveryTime ?? null,
    },
    items: items.map(it => {
      const rawSpecs =
        Array.isArray(it.specifications)
          ? it.specifications
          : normalizeSpecsAny(it.specifications);

      const buyerSpecs = Array.isArray(it.buyerSpecifications)
        ? it.buyerSpecifications
        : [];

      const specifications = rawSpecs.length ? rawSpecs : buyerSpecs;

      return {
        productName: it.productName ?? "",
        categoryPath: it.categoryPath ?? null,
        barcode: it.barcode ?? null,
        quantity: Number(it.quantity ?? 0),
        purchaseType: it.purchaseType ?? null,
        specifications,
        buyerSpecifications: buyerSpecs, // keep for completeness
      };
    }),
  };
}
