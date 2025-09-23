// src/utils/rfqShape.js
/**
 * @typedef {Object} RFQItem
 * @property {string} name
 * @property {number|string} quantity
 * @property {string} [unit]
 * @property {string} [categoryPath]
 * @property {number} [attrsCount]
 *
 * @typedef {Object} RFQCardRow
 * @property {string} [id]
 * @property {string} [publicId]
 * @property {string} [title]
 * @property {string} [status]      // 'open' | 'closed' | 'awarded' | etc.
 * @property {string} [postedAt]    // ISO
 * @property {string} [deadline]    // ISO
 * @property {{name?: string}} [buyer]
 * @property {number} [views]
 * @property {number} [quotationsCount]
 * @property {RFQItem[]} [items]
 * @property {string} [notes]
 */

/** @param {any} r @returns {RFQCardRow} */
export function normalizeRFQ(r) {
  return {
    id: r?.id ?? r?.rfq_id ?? r?.publicId,
    publicId: r?.publicId ?? r?.public_id ?? r?.id,
    title: r?.title ?? r?.name ?? "Untitled RFQ",
    status: r?.status ?? "open",
    postedAt: r?.postedAt ?? r?.created_at ?? r?.createdAt ?? null,
    deadline: r?.deadline ?? r?.due_at ?? null,
    buyer: r?.buyer || { name: r?.buyer_name },
    views: r?.views ?? 0,
    quotationsCount: r?.quotationsCount ?? r?.quotes_count ?? 0,
    items: Array.isArray(r?.items) ? r.items : [],
    notes: r?.notes ?? r?.description ?? null,
  };
}
