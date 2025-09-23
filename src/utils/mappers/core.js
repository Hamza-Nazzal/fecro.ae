// src/utils/mappers/core.js

// —— coercion helpers ——
export const emptyToNull = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") {
    const s = v.trim();
    return s === "" ? null : s;
  }
  return v;
};

export const intOrNull = (v) => {
  const s = emptyToNull(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export const dateOrNull = (v) => {
  const s = emptyToNull(v);
  if (s === null) return null;
  if (s instanceof Date) return s.toISOString().slice(0, 10); // YYYY-MM-DD
  if (typeof s === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  }
  return null;
};

// remove nullish keys from an object
export const pruneNullish = (obj) => {
  if (!obj) return obj;
  Object.keys(obj).forEach((k) => {
    if (obj[k] === null || obj[k] === undefined) delete obj[k];
  });
  return obj;
};

// generic omit-nullish (optionally drop empty strings)
export function omitNullish(obj, { omitEmptyString = false } = {}) {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (omitEmptyString && typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out;
}

// small util for arrays
export const mapArray = (array, mapperFn) =>
  Array.isArray(array) ? array.map(mapperFn).filter(Boolean) : [];

// —— generic mapper engine ——
export function createMapper(schema) {
  return {
    toJs: (dbObj) => {
      if (!dbObj) return null;
      const result = {};
      Object.entries(schema).forEach(([jsField, mapping]) => {
        if (typeof mapping === "string") {
          result[jsField] = dbObj[mapping];
        } else if (mapping && typeof mapping === "object") {
          if (typeof mapping.toJs === "function") {
            result[jsField] = mapping.toJs(dbObj);
          }
        }
      });
      return result;
    },

    toDb: (jsObj) => {
      if (!jsObj) return null;
      const result = {};
      Object.entries(schema).forEach(([jsField, mapping]) => {
        if (typeof mapping === "string") {
          const dbField = mapping;
          result[dbField] = emptyToNull(jsObj[dbField] ?? jsObj[jsField]);
        } else if (mapping && typeof mapping === "object" && mapping.toDb) {
          const dbField = mapping.dbField; // explicit only
          if (dbField) {
            result[dbField] = mapping.toDb(jsObj);
          }
        }
      });
      return pruneNullish(result);
    },
  };
}

// allow dynamic schemas when needed
export function addEntityMapper(entityName, schema) {
  const mapper = createMapper(schema);
  return {
    [`${entityName}DbToJs`]: mapper.toJs,
    [`${entityName}JsToDb`]: mapper.toDb,
  };
}
