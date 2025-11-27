// src/services/backends/supabase/rfqs/hydrateSeller.js
import { supabase } from "../../supabase";
import { mapSellerHydrate } from "../../../../utils/mappers/sellerHydrateMapper";

export async function hydrateRFQForSeller(rfqId, sellerId) {
  const { data, error } = await supabase.rpc("rfq_hydrate_seller", {
    _rfq_id: rfqId,
    _seller_id: sellerId,
  });
  console.log("🔥 RAW HYDRATE SELLER FROM API:", data);

  if (error) throw new Error(error.message);
  
  // TEMP debug (REMOVE AFTER AUDIT)
  console.debug('[RPC-RAW]', {
    items0Keys: (Array.isArray(data?.items) && data.items[0]) ? Object.keys(data.items[0]) : null,
    hasBuyerSpecs0: Array.isArray(data?.items?.[0]?.buyerSpecifications) ? data.items[0].buyerSpecifications.length : null
  });
  
  const mapped = mapSellerHydrate(data, rfqId);
  
  // TEMP debug (REMOVE AFTER AUDIT)
  console.debug('[MAPPED-ITEMS]', {
    len: Array.isArray(mapped?.items) ? mapped.items.length : null,
    item0Keys: (Array.isArray(mapped?.items) && mapped.items[0]) ? Object.keys(mapped.items[0]) : null,
    buyerSpecs0: Array.isArray(mapped?.items?.[0]?.buyerSpecifications) ? mapped.items[0].buyerSpecifications.length : null,
    specs0ArrLen: Array.isArray(mapped?.items?.[0]?.specifications) ? mapped.items[0].specifications.length : null,
    specs0Obj: (mapped?.items?.[0]?.specifications && !Array.isArray(mapped.items[0].specifications) && typeof mapped.items[0].specifications === 'object') || false
  });
  
  return mapped;
}
