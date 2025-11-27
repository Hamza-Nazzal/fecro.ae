// hubgate-api/src/mappers/sellerRfqCardMapper.js
// Convert snake_case → camelCase for seller RFQ cards

export function mapSellerRfqCard(row = {}) {
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
      row.quotations_count ??
      row.quotes_count ??
      row.quotationsCount ??
      0
    ),
    itemsCount: Number(row.items_count ?? 0),
    itemsPreview: Array.isArray(row.items_preview) ? row.items_preview : [],
    itemsSummary: Array.isArray(row.items_summary) ? row.items_summary : [],
    // Pass through raw fields for backward compatibility
    company_city: companyCity,
    company_state: companyState,
    company_country: companyCountry,
  };

  // Only include companyLocation if at least one field is non-null
  if (companyCity != null || companyState != null || companyCountry != null) {
    result.companyLocation = {
      city: companyCity,
      state: companyState,
      country: companyCountry,
    };
  }

  return result;
}

