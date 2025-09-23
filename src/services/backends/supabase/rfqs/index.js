// src/services/backends/supabase/rfqs/index.js
import { mapRowsToJs, rowToJs, listRFQRows, fetchRFQRow, insertRFQ, patchRFQ, removeRFQ } from "./base";
import { fetchItems, upsertItem, upsertItemSpecs, deleteSpecsNotIn, cascadeDeleteItems } from "./items";
import { getRFQHydrated } from "./hydrate";
import { rfqDbToJs } from "../../../../utils/mappers";

/** List top-level RFQs (no hydration) */
export async function listRFQs(opts = {}) {
  const rows = await listRFQRows(opts);
  return mapRowsToJs(rows);
}

/** List my RFQs (top-level) */
export async function listMyRFQs(userId) {
  const rows = await listRFQRows({ userId });
  return mapRowsToJs(rows);
}

/** Full read (RFQ + items + specs) */
export async function getRFQ(id) {
  return await getRFQHydrated(id);
}

/** Create RFQ and (optionally) its child items/specs; return hydrated */
export async function createRFQ(rfqJs) {
  const now = new Date().toISOString();
  const rfqRow = await insertRFQ(rfqJs);

  if (Array.isArray(rfqJs.items) && rfqJs.items.length) {
    for (const it of rfqJs.items) {
      const itemId = await upsertItem(it, rfqRow.id, now);
      // If specs object is present, upsert all and do not delete anything (new item)
      if (it.specifications && typeof it.specifications === "object") {
        await upsertItemSpecs(itemId, it.specifications, now);
      }
    }
  }
  return await getRFQHydrated(rfqRow.id);
}

/** Update RFQ; if updates.items provided, upsert + delete removed specs; return hydrated */
export async function updateRFQ(id, updatesJs) {
  const now = new Date().toISOString();
  // Patch top-level first (if any fields present)
  const top = { ...updatesJs };
  delete top.items;
  if (Object.keys(top).length) {
    await patchRFQ(id, top);
  }

  // Touch children only if provided
  if (Array.isArray(updatesJs.items)) {
    for (const it of updatesJs.items) {
      const itemId = await upsertItem(it, id, now);
      if (Object.prototype.hasOwnProperty.call(it, "specifications")) {
        const incoming = await upsertItemSpecs(itemId, it.specifications || {}, now);
        // Delete removed keys (parity with previous implementation)
        await deleteSpecsNotIn(itemId, incoming);
      }
    }
  }

  return await getRFQHydrated(id);
}

/** Delete RFQ with manual cascade */
export async function deleteRFQ(id) {
  await cascadeDeleteItems(id);
  await removeRFQ(id);
  return true;
}

export { seedDemoRFQs } from "./seed";
