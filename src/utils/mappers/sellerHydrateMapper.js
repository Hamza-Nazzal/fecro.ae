// src/utils/mappers/sellerHydrateMapper.js
function sellerIdDisplayFromHydrate(dto, rfqId) {
  if (dto?.sellerIdDisplay) return dto.sellerIdDisplay;
  const baseId = dto?.id ?? rfqId;
  if (baseId === undefined || baseId === null) return null;
  const input = String(baseId);
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hash = ((h1 ^ h2) >>> 0).toString(16).padStart(10, "0").slice(0, 10).toUpperCase();
  return `SRF-${hash}`;
}

export function mapSellerHydrate(dto, rfqId) {
  const safe = dto ?? {};
  const items = Array.isArray(safe.items) ? safe.items : [];
  const od = safe.orderDetails || {};
  return {
    id: safe.id ?? rfqId,
    publicId: safe.publicId ?? null,
    sellerIdDisplay: sellerIdDisplayFromHydrate(safe, rfqId),
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
    items: items.map(it => ({
      productName: it.productName ?? "",
      categoryPath: it.categoryPath ?? null,
      barcode: it.barcode ?? null,
      quantity: Number(it.quantity ?? 0),
      purchaseType: it.purchaseType ?? null,
      specifications: Array.isArray(it.specifications) ? it.specifications : [],
    })),
  };
}
