// src/services/backends/supabase/rfqs/hydrate.js
import { rfqDbToJs } from "../../../../utils/mappers";
import { fetchRFQRow } from "./base";
import { fetchItems, fetchSpecsByItemIds, buildHydratedItems } from "./items";

/** Full read: RFQ + items + specs */
export async function getRFQHydrated(id) {
  const rfqRow = await fetchRFQRow(id);
  const rfq = rfqDbToJs(rfqRow);

  const itemsRows = await fetchItems(id);
  const itemIds = itemsRows.map((r) => r.id);
  const specsRows = await fetchSpecsByItemIds(itemIds);

  const items = buildHydratedItems(itemsRows, specsRows);
  return { ...rfq, items };
}
