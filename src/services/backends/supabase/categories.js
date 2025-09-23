// src/services/backends/supabase/categories.js
import { supabase } from '../supabase';

/** List top-level categories or children of a given parent_id */
export async function listCategories(parentId = null) {
  let query = supabase.from('categories').select('*').order('name', { ascending: true });
  if (parentId) query = query.eq('parent_id', parentId);
  else query = query.is('parent_id', null);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/** Basic search by name ILIKE */
export async function searchCategories(q) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .ilike('name', `%${q}%`)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}
