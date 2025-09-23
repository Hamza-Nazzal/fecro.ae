// src/services/rfqService/specs.js
import { supabase } from "../backends/supabase";
import { getRFQ } from "./reads";

/** All spec helpers return the hydrated RFQ */
export async function addSpec({ rfqId, itemId, key, label, value, unit = null }) {
  const { error } = await supabase.rpc("rfq_add_spec", {
    _rfq_id: rfqId,
    _item_id: itemId,
    _key: key,
    _label: label ?? key,
    _value: value,
    _unit: unit,
  });
  if (error) throw error;
  return await getRFQ(rfqId);
}

export async function updateSpec({ rfqId, itemId, key, value, unit = null }) {
  const { error } = await supabase.rpc("rfq_update_spec", {
    _rfq_id: rfqId,
    _item_id: itemId,
    _key: key,
    _value: value,
    _unit: unit,
  });
  if (error) throw error;
  return await getRFQ(rfqId);
}

export async function removeSpec({ rfqId, itemId, key }) {
  const { error } = await supabase.rpc("rfq_remove_spec", {
    _rfq_id: rfqId,
    _item_id: itemId,
    _key: key,
  });
  if (error) throw error;
  return await getRFQ(rfqId);
}
