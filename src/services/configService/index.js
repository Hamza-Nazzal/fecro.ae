// src/services/configService/index.js

import { supabase } from "../backends/supabase";
export async function getUnits() {
  const { data, error } = await supabase.from("units_catalog").select("name").eq("status","active").order("name");
  if (error) throw new Error(error.message);
  return (data || []).map(r => r.name);
}