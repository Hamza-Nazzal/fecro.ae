// src/utils/mappers/sellerHydrateMapper.js
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
    sellerIdDisplay: sellerRfqId, // Temporary alias for backward compatibility
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
