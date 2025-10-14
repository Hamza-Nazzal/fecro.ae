// src/services/backends/products.js
// Products backend on Supabase with camelCase <-> snake_case mapping.
// This file is re-exported by src/services/productsService.js.

import { supabase } from "./supabase"; // same client used elsewhere

function dbToJs(r) {
  if (!r) return r;
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    description: r.description,
    categoryId: r.category_id,
    categoryPath: (r.categories && r.categories.path_text) || r.category || r.sub_category || "",
    category: r.category,
    subCategory: r.sub_category,
    price: r.price,
    currency: r.currency,
    stock: r.stock,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function jsToDb(o) {
  if (!o) return o;
  const d = {};
  if (o.id !== undefined) d.id = o.id;
  if (o.sku !== undefined) d.sku = o.sku;
  if (o.name !== undefined) d.name = o.name;
  if (o.description !== undefined) d.description = o.description;
  if (o.category_id !== undefined || o.categoryId !== undefined)
  d.category_id = o.category_id ?? o.categoryId;
  if (o.category !== undefined) d.category = o.category;
  if (o.sub_category !== undefined || o.subCategory !== undefined)
    d.sub_category = o.sub_category ?? o.subCategory;
  if (o.price !== undefined) d.price = o.price;
  if (o.currency !== undefined) d.currency = o.currency;
  if (o.stock !== undefined) d.stock = o.stock;
  if (o.status !== undefined) d.status = o.status;
  if (o.created_at !== undefined || o.createdAt !== undefined)
    d.created_at = o.created_at ?? o.createdAt;
  if (o.updated_at !== undefined || o.updatedAt !== undefined)
    d.updated_at = o.updated_at ?? o.updatedAt;
  return d;
}

export async function listProducts(filters = {}) {
  let q = supabase.from("products").select("id,sku,name,description,price,currency,stock,status,created_at,updated_at,category_id, categories:category_id(name, path_text)");
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters.status) q = q.eq("status", filters.status);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(dbToJs);
}

export async function getProduct(id) {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories:category_id(name, path_text)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return dbToJs(data);
}

export async function createProduct(product) {
  const payload = jsToDb(product);
  if (payload.categoryId != null) {
  delete payload.categoryId;
}
  const { data, error } = await supabase
    .from("products")
    .insert([payload])
    .select("*, categories:category_id(name, path_text)")   // ← embed full path
    .single();
  if (error) throw error;
  return dbToJs(data);
}

export async function updateProduct(id, updates) {
  const payload = jsToDb(updates);
  if (payload.category_id == null && payload.categoryId != null) {
  payload.category_id = payload.categoryId;
  delete payload.categoryId;
}
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select("*, categories:category_id(name, path_text)")   // ← embed full path
    .single();
  if (error) throw error;
  return dbToJs(data);
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  return true;
}
