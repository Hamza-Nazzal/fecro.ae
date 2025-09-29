// src/services/rfqService/errors.js
export function isMissingRelationError(error, relationName) {
  const msg = String(error?.message || "").toLowerCase();
  if (!relationName) return false;
  const rel = relationName.toLowerCase();
  return (
    (msg.includes("does not exist") ||
      msg.includes("unknown table") ||
      msg.includes("undefined table")) &&
    msg.includes(rel)
  );
}