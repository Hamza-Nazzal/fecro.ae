// hubgate-api/src/mappers/sellerRfqCardMapper.js
// Convert snake_case → camelCase for seller RFQ cards

export function mapSellerRfqCard(row = {}) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    publicId: row.public_id ?? row.id ?? null,
    sellerRfqId: row.seller_rfq_id ?? null,
    title: row.title ?? row.public_id ?? "RFQ",
    status: row.status ?? "active",
    postedAt: row.created_at ?? null,
    categoryPath: row.first_category_path ?? row.category_path ?? "",
    quotationsCount: Number(
      row.quotations_count ??
      row.quotes_count ??
      row.quotationsCount ??
      0
    ),
    itemsCount: Number(row.items_count ?? 0),
    itemsPreview: Array.isArray(row.items_preview) ? row.items_preview : [],
    itemsSummary: Array.isArray(row.items_summary) ? row.items_summary : [],
  };
}

