// src/hooks/useRfqItems.js

/** Return RFQ items across multiple possible shapes. */
export function getRfqItems(r) {
  if (!r) return [];

  // Most common shapes
  if (Array.isArray(r.items) && r.items.length) return r.items;
  if (Array.isArray(r.rfq_items) && r.rfq_items.length) return r.rfq_items;

  // Hydrated container variants from services
  if (Array.isArray(r?.rfq?.items) && r.rfq.items.length) return r.rfq.items;
  if (Array.isArray(r?.header?.items) && r.header.items.length) return r.header.items;
  if (Array.isArray(r?.data?.items) && r.data.items.length) return r.data.items;
  if (Array.isArray(r?.payload?.items) && r.payload.items.length) return r.payload.items;

  // Grouped formats (categories -> items[])
  if (Array.isArray(r.categories)) {
    const flat = r.categories.flatMap(c =>
      Array.isArray(c.items) ? c.items.map(it => ({ ...it, _category_from_group: c.name || c.title })) : []
    );
    if (flat.length) return flat;
  }
  if (Array.isArray(r.items_by_category)) {
    const flat = r.items_by_category.flatMap(g =>
      Array.isArray(g.items) ? g.items.map(it => ({ ...it, _category_from_group: g.path || g.name })) : []
    );
    if (flat.length) return flat;
  }

  // Last-resort heuristic: scan for an "items-like" array
  for (const v of Object.values(r)) {
    if (Array.isArray(v) && v.length && typeof v[0] === "object") {
      const o = v[0];
      const looksLikeItem = ("quantity" in o) || ("qty" in o) || ("product_name" in o) || ("specs" in o) || ("specs_map" in o);
      if (looksLikeItem) return v;
    }
  }
  return [];
}

export function getCategoryPath(it) {
  return (
    it.categoryPath ||
    it.category_breadcrumb ||
    it._category_from_group ||
    [it.category_level1, it.category_level2, it.category_level3].filter(Boolean).join(" → ") ||
    "Uncategorized"
  );
}

export function getItemId(it) {
  return it.id ?? it.rfq_item_id ?? it.item_id ?? it.itemId ?? null;
}