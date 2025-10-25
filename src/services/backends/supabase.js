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


  // De-dup in-flight GETs by URL — but return a FRESH clone per subscriber
const inFlight = new Map(); // key: URL string -> Promise<Response>

const dedupingFetch = (input, init = {}) => {
  const method = (init.method || "GET").toUpperCase();
  const realFetch = window.fetch.bind(window);

  if (method !== "GET") return realFetch(input, init);

  const key =
    typeof input === "string"
      ? input
      : (input && (input.url || input.toString())) || String(input);

  let p = inFlight.get(key);
  if (p) {
    // Important: each subscriber must get its own clone
    return p.then((res) => res.clone());
  }

  p = realFetch(input, init).finally(() => inFlight.delete(key));
  inFlight.set(key, p);

  // First subscriber also gets a clone, so nobody shares the same Response instance
  return p.then((res) => res.clone());
};

/*
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
*/

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
