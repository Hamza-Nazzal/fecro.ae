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

      id: it.id ?? null,
      productName: it.productName ?? "",
      categoryPath: it.categoryPath ?? null,
      barcode: it.barcode ?? null,
      quantity: Number(it.quantity ?? 0),
      purchaseType: it.purchaseType ?? null,
      //specifications: specsArr, // array for renderer
      // specifications: Array.isArray(it.specifications) ? it.specifications : [],
      buyerSpecifications: Array.isArray(it.buyerSpecifications) ? it.buyerSpecifications : [],

      /*
      specifications: Array.isArray(it.specifications)
        ? it.specifications
        : (it && typeof it.specifications === 'object' && it.specifications !== null
         ? Object.entries(it.specifications)
          .map(([key_norm, v]) => {
            const kn = typeof key_norm === 'string' ? key_norm.trim() : '';
            const label = typeof v?.key_label === 'string' ? v.key_label.trim() : kn;
            const value = v?.value != null ? String(v.value).trim() : '';
            const unit = v?.unit != null ? String(v.unit).trim() : null;
            if (!kn || !label || !value) return null; // drop malformed
            return { key_norm: kn, key_label: label, value, unit };
          })
          .filter(Boolean)
      : []),
      */
        specifications: Array.isArray(it.specifications)
          ? it.specifications
          : (Array.isArray(it.buyerSpecifications)
              ? it.buyerSpecifications
              : []),


    })),
  };
}
