// src/services/rfqService/util.js

// Browser/Node-safe crypto getter
function getCryptoSafe() {
  if (typeof window !== "undefined" && window.crypto) return window.crypto;
  if (typeof global !== "undefined" && global.crypto) return global.crypto;
  return null;
}

export function makePublicId(len = 6) {
  const ALPH = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const c = getCryptoSafe();
  const bytes = c?.getRandomValues
    ? c.getRandomValues(new Uint8Array(len))
    : Array.from({ length: len }, () => Math.floor(Math.random() * 256));
  let code = "";
  for (let i = 0; i < len; i++) code += ALPH[bytes[i] % 36];
  return `RFQ-${code}`;
}
