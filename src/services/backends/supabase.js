// src/services/backends/supabase.js
import { createClient } from "@supabase/supabase-js";

// CRA / Vite / Next-public envs (non-throwing)
const ie = (typeof import.meta !== "undefined" && import.meta.env) || {};
export const SB_PROJECT_URL =
  ie.VITE_SUPABASE_URL ||
  ie.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";
export const SB_ANON_KEY =
  ie.VITE_SUPABASE_ANON_KEY ||
  ie.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

// De-dup in-flight GETs by URL
const inFlight = new Map(); // key: URL string -> Promise<Response>
const dedupingFetch = (url, opts = {}) => {
  const method = (opts.method || 'GET').toUpperCase();
  if (method !== 'GET') return window.fetch(url, opts);
  const key = typeof url === 'string' ? url : url.toString();
  if (inFlight.has(key)) return inFlight.get(key);
  const p = window.fetch(url, opts).finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
};

// Single client with deduplication
export const supabase = createClient(SB_PROJECT_URL, SB_ANON_KEY, { global: { fetch: dedupingFetch } });
export default supabase;

// Re-export domain modules (keep AFTER client init)
//export * from "./supabase/auth";
//export * from "./supabase/rfqs";
//export * from "./supabase/quotations";
//export * from "./supabase/products";
//export * from "./supabase/categories";
//export * from "./supabase/events";
