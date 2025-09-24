// src/services/backends/supabase/rfqs/hydrateSeller.js
import { supabase } from "../../supabase";
import { mapSellerHydrate } from "../../../../utils/mappers/sellerHydrateMapper";

export async function hydrateRFQForSeller(rfqId, sellerId) {
  const { data, error } = await supabase.rpc("rfq_hydrate_seller", {
    _rfq_id: rfqId,
    _seller_id: sellerId,
  });
  if (error) throw new Error(error.message);
  return mapSellerHydrate(data, rfqId);
}
