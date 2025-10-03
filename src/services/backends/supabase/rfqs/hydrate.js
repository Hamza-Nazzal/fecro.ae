// src/services/backends/supabase/rfqs/hydrate.js
import { rfqDbToJs } from "../../../../utils/mappers";
import { normalizeSpecs } from "../../../../utils/specs";
import { fetchRFQRow } from "./base";
import { fetchItems, fetchSpecsByItemIds, buildHydratedItems } from "./items";

/** Full read: RFQ + items + specs */
export async function getRFQHydrated(id) {
  const rfqRow = await fetchRFQRow(id);
  const rfq = rfqDbToJs(rfqRow);

  const itemsRows = await fetchItems(id);
  const itemIds = itemsRows.map((r) => r.id);
  const specsRows = await fetchSpecsByItemIds(itemIds);

  const specsByItemId = new Map();
  for (const row of specsRows) {
    if (!row?.rfq_item_id) continue;
    if (!specsByItemId.has(row.rfq_item_id)) {
      specsByItemId.set(row.rfq_item_id, []);
    }
    specsByItemId.get(row.rfq_item_id).push(row);
  }

  const items = buildHydratedItems(itemsRows, specsRows).map((item) => {
    const rfqItemSpecs = specsByItemId.get(item.id) || [];
    const next = {
      ...item,
      rfq_item_specs: rfqItemSpecs,
    };
    next.specs = normalizeSpecs(
      next.rfq_item_specs ||
        next.specs ||
        next.spec_list ||
        next.specs_map ||
        next.attributes ||
        next.props
    );
    return next;
  });

  return { ...rfq, items };
}
