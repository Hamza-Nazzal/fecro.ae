// src/utils/location/normalizeLocation.js
/**
 * Normalizes location data from various input formats to canonical { city, state, country } shape.
 * Always returns an object (never null), even if all fields are null.
 * 
 * Legacy fields like "emirate", "rfq_emirate", "location_emirate" are read as inputs
 * but normalized into the "state" field. The returned object NEVER has an "emirate" key.
 * 
 * @param {any} raw - Input object that may have city, state, country, or legacy emirate fields
 * @returns {{ city: string|null, state: string|null, country: string|null }}
 */
export function normalizeLocation(raw = {}) {
  // Read city from various possible keys
  const city =
    raw.city ??
    raw.city_name ??
    raw.location_city ??
    raw.rfq_city ??
    raw.company_city ??
    raw.buyer_company_city ??
    null;

  // Read state from various possible keys
  // Legacy fields (emirate variants) are read as inputs but normalized to state
  const state =
    raw.state ??
    raw.rfq_state ??
    raw.location_state ??
    raw.company_state ??
    raw.buyer_company_state ??
    // Legacy emirate fields (string keys only, read as inputs, normalized to state):
    raw.emirate ??
    raw.rfq_emirate ??
    raw.location_emirate ??
    null;

  // Read country from various possible keys
  const country =
    raw.country ??
    raw.country_name ??
    raw.location_country ??
    raw.rfq_country ??
    raw.company_country ??
    raw.buyer_company_country ??
    null;

  // ALWAYS return an object with ONLY { city, state, country }
  // NEVER include "emirate" in the returned object
  return {
    city: city ?? null,
    state: state ?? null,
    country: country ?? null,
  };
}

