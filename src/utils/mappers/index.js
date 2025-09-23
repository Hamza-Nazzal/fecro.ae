// src/utils/mappers/index.js

// --- imports (must be first) ---
import {
  createMapper,
  addEntityMapper as _addEntityMapper,
  emptyToNull,
  intOrNull,
  dateOrNull,
  omitNullish,
  mapArray,
} from "./core.js";
import { specsRowsToObject } from "./specs.js";
import { RFQ_SCHEMA } from "./rfq.js";
import { PRODUCT_SCHEMA } from "./product.js";
import { QUOTATION_SCHEMA } from "./quotation.js";
import { EVENT_SCHEMA } from "./event.js";

// --- build mappers ---
const rfqMapper = createMapper(RFQ_SCHEMA);
const productMapper = createMapper(PRODUCT_SCHEMA);
const quotationMapper = createMapper(QUOTATION_SCHEMA);
const eventMapper = createMapper(EVENT_SCHEMA);

// --- re-exports (same public API as before) ---
export { emptyToNull, intOrNull, dateOrNull, omitNullish, mapArray, specsRowsToObject };

// expose addEntityMapper with the same name as before
export const addEntityMapper = _addEntityMapper;

// RFQ
export const rfqDbToJs = rfqMapper.toJs;
export const rfqJsToDb = rfqMapper.toDb;

// Product
export const productDbToJs = productMapper.toJs;
export const productJsToDb = productMapper.toDb;

// Quotation
export const quotationDbToJs = quotationMapper.toJs;
export const quotationJsToDb = quotationMapper.toDb;

// Event
export const eventDbToJs = eventMapper.toJs;
export const eventJsToDb = eventMapper.toDb;
