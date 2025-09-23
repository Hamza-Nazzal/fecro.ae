// src/hooks/useRFQ/actions.js
import {
  // rfqService wraps your active backend and returns hydrated RFQs
  getRFQ as beGetRFQ,
  createRFQ as beCreateRFQ,
  updateRFQ as beUpdateRFQ,
  deleteRFQ as beDeleteRFQ,
  addSpec as beAddSpec,
  updateSpec as beUpdateSpec,
  removeSpec as beRemoveSpec,
} from "../../services/rfqService";

// Demo seeds (Diag/onboarding) are provided by backend
import { seedDemoRFQs as beSeedDemoRFQs } from "../../services/backends/supabase";

// ------- Pure action wrappers (no state mutations here) ------- //
export const fetchRFQ = (id) => beGetRFQ(id);

export const createRFQ = (payload) => beCreateRFQ(payload);
export const updateRFQ = (id, patch) => beUpdateRFQ(id, patch);
export const deleteRFQ = (id) => beDeleteRFQ(id);

export const addSpec = (args) => beAddSpec(args);
export const updateSpec = (args) => beUpdateSpec(args);
export const removeSpec = (args) => beRemoveSpec(args);

// Diag/onboarding helper
export const seedDemoRFQs = (opts) => beSeedDemoRFQs(opts);
