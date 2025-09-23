// src/services/productsService.js
import { supabase } from "./backends/supabase";
import {
  createProduct as beCreateProduct,
  updateProduct as beUpdateProduct,
  deleteProduct as beDeleteProduct,
} from "./backends/products";
import { productJsToDb, productDbToJs } from "../utils/mappers";

// ---- Reads with nested categories ----

export async function listProducts({ userId, status } = {}) {
  let q = supabase
    .from("products")
    .select("*, categories:category_id(name, path_text)")
    .order("created_at", { ascending: false });

  if (userId) q = q.eq("user_id", userId);
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(productDbToJs);
}

export async function getProduct(id) {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories:category_id(name, path_text)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return productDbToJs(data);
}

// ---- Mutations (keep using your backend if it contains extra logic) ----

export async function createProduct(product) {
  const created = await beCreateProduct(productJsToDb(product));
  return created ? productDbToJs(created) : created;
}

export async function updateProduct(id, updates) {
  const updated = await beUpdateProduct(id, productJsToDb(updates));
  return updated ? productDbToJs(updated) : updated;
}

export async function deleteProduct(id) {
  return beDeleteProduct(id);
}
