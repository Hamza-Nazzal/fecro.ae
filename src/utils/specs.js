// src/utils/specs.js
import { normalizeSpec } from "../components/rfq-form/spec-editor/logic";

/** Normalize any specs-like input into [{ key_label, value, unit? }] using normalizeSpec() */
export function normalizeSpecs(input) {
  if (!input) return [];
  // Array of objects
  if (Array.isArray(input)) {
    return input
      .map((s) => {
        const n = normalizeSpec(s);
        // keep only non-empty key + value
        if (!n.key_label || !n.value) return null;
        return n;
      })
      .filter(Boolean);
  }
  // Map/object shapes (specs_map / attributes / props / specs:{...})
  if (typeof input === "object") {
    // nested `specs` object
    if (input.specs && typeof input.specs === "object" && !Array.isArray(input.specs)) {
      return Object.entries(input.specs).map(([k, v]) => normalizeSpec({ key_label: k, value: v }));
    }
    const mapCandidate = input.specs_map || input.attributes || input.props;
    if (mapCandidate && typeof mapCandidate === "object") {
      return Object.entries(mapCandidate).map(([k, v]) => normalizeSpec({ key_label: k, value: v }));
    }
    // known array fields from hydrators/legacy
    const arrCandidate = input.rfq_item_specs || input.item_specs || input.spec_list;
    if (Array.isArray(arrCandidate)) return normalizeSpecs(arrCandidate);
  }
  return [];
}

// Optional re-export if you want direct access elsewhere
export { normalizeSpec } from "../components/rfq-form/spec-editor/logic";