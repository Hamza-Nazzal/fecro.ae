// src/services/ids.js
// src/services/ids.js
// Minimal, shared ID helpers. ESLint-safe (no 'self' or 'globalThis').

/*

1	ID helpers to generate UUIDs and unique RFQ public IDs in browser or Node.
	2	Prefers crypto APIs when available; has safe fallbacks. Ensures “RFQ-XXXXXX” uniqueness.
  */

function getCryptoSafe() {
  // Prefer browser window, then Node's global (if provided by runtime)
  if (typeof window !== "undefined" && window.crypto) return window.crypto;
  if (typeof global !== "undefined" && global.crypto) return global.crypto;
  return null;
}

export function makeUUID() {
  const c = getCryptoSafe();
  if (c?.randomUUID) return c.randomUUID();

  if (c?.getRandomValues) {
    // RFC4122 v4 using getRandomValues
    const a = new Uint8Array(16);
    c.getRandomValues(a);
    a[6] = (a[6] & 0x0f) | 0x40; // version 4
    a[8] = (a[8] & 0x3f) | 0x80; // variant
    const h = [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  // Non-crypto fallback (dev only)
  return "uuid-" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ensureUniquePublicId(existing = []) {
  const used = new Set(existing);
  let candidate;
  do {
    candidate = "RFQ-" + String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  } while (used.has(candidate));
  return candidate;
}
