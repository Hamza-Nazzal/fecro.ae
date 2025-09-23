// src/services/backends/supabase/products.js
import { supabase } from '../supabase';
import { productJsToDb, productDbToJs } from '../../../utils/mappers';

export async function listProducts({ search } = {}) {
  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (search) query = query.ilike('name', `%${search}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(productDbToJs);
}

export async function getProduct(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return productDbToJs(data);
}

export async function putProduct(product) {
  const row = productJsToDb(product);
  const { data, error } = await supabase.from('products').upsert(row).select('*').single();
  if (error) throw new Error(error.message);
  return productDbToJs(data);
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}
