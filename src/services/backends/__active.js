// src/services/backends/__active.js
/*
1	Backend switch that currently selects the Supabase RFQ backend.
	2	Swap this import to change backends (e.g., to IndexedDB) without touching UI code.
*/
/*
export * from "./supabase";

export { supabase, SB_PROJECT_URL, SB_ANON_KEY } from './supabase';
*/


// src/services/backends/__active.js
export * from "./supabase/auth";
export * from "./supabase/rfqs";
export * from "./supabase/quotations";
export * from "./supabase/products";
export * from "./supabase/categories";
export * from "./supabase/events";

export { supabase, SB_PROJECT_URL, SB_ANON_KEY } from "./supabase";





/*



Uncomment the switcher if you want to run the app without Supabase (offline/dev) or in CI/tests.
Set VITE_BACKEND=local and ensure callers import service funcs from backends/__active (not the raw supabase client).
This lets the app use IndexedDB for RFQs/specs when Supabase creds/network aren’t available (e.g., demos).



// src/services/backends/__active.js
// Backend switcher: choose Supabase (default) or local IndexedDB
// Set VITE_BACKEND="local" to use the offline adapter.

import * as supabaseBackend from "./supabase"
import * as localBackend from "./localIndexedDb"


// Decide which backend to use:
//   - Default: "supabase"
//   - To use local IndexedDB in dev, set: VITE_BACKEND=local
const BACKEND =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_BACKEND) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.VITE_BACKEND) ||
  "supabase"

const impl = BACKEND === "local" ? localBackend : supabaseBackend

// Re-export a consistent surface so the rest of the app can import from here
export const listRFQs = impl.listRFQs
export const getRFQ = impl.getRFQ
export const listMyRFQs =
  impl.listMyRFQs || (async () => { throw new Error("listMyRFQs not implemented in active backend") })

export const createRFQ = impl.createRFQ
export const updateRFQ = impl.updateRFQ
export const deleteRFQ = impl.deleteRFQ

// Spec-level helpers (present in both backends after Steps 7–9)
export const addSpec = impl.addSpec
export const updateSpec = impl.updateSpec
export const removeSpec = impl.removeSpec

// For convenience, expose which backend is active (optional)
export const ACTIVE_BACKEND = BACKEND

// If other modules import the raw supabase client directly, they should keep importing
// from "./supabase". This file is only for swapping the *service* functions above.
export default {
  ACTIVE_BACKEND,
  listRFQs,
  getRFQ,
  listMyRFQs,
  createRFQ,
  updateRFQ,
  deleteRFQ,
  addSpec,
  updateSpec,
  removeSpec,
}
*/