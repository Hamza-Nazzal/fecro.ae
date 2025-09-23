// src/hooks/useRFQ/index.js

// imports first
import { useRFQList, useRFQs } from "./useRFQList";
import { useRFQ } from "./useRFQSingle";
import * as rfqActions from "./actions";

// named exports
export { useRFQList, useRFQs, useRFQ, rfqActions };

// default export: BACK-COMPAT → list hook returning an ARRAY
export default useRFQs;
