//src/services/searchService.js

import { supabase } from "./backends/supabase";

export async function suggest(term) {
  if (!term || term.trim().length < 2) return { categories: [], products: [] };
  const { data, error } = await supabase.rpc("suggest", { q: term.trim(), max_cat: 8, max_prod: 0 });
  if (error) throw error;
  return data; // { categories: [...], products: [] }
}