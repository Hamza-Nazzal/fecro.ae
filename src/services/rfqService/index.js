// src/services/rfqService/index.js

// src/services/rfqService/index.js

// imports first (for default export bundling)
import * as reads from "./reads";
import * as writes from "./writes";
import * as specs from "./specs";
import * as seeds from "./seeds";
import { makePublicId } from "./util";

// keep fast named re-exports (so tree-shaking can work)
export { listRFQs, listMyRFQs, getRFQ, getRFQById } from "./reads";
export { listRFQsForCards } from "./reads";
export { createRFQ, updateRFQ, deleteRFQ } from "./writes";
export { addSpec, updateSpec, removeSpec } from "./specs";
export { seedRFQs, seedDemoQuotations, createQuotationRecord } from "./seeds";
export { makePublicId } from "./util";
export { makeUUID, ensureUniquePublicId } from "../ids";

// default export for convenience
const api = { ...reads, ...writes, ...specs, ...seeds, makePublicId };
export default api;





/*
export { listRFQs, listMyRFQs, getRFQ } from "./reads";
export { createRFQ, updateRFQ, deleteRFQ } from "./writes";
export { addSpec, updateSpec, removeSpec } from "./specs";
export { seedRFQs, seedDemoQuotations, createQuotationRecord } from "./seeds";
export { makePublicId } from "./util";

// keep these re-exports to match original file
export { makeUUID, ensureUniquePublicId } from "../ids";

// optional default bundle (handy in some places)
import * as _reads from "./reads";
import * as _writes from "./writes";
import * as _specs from "./specs";
import * as _seeds from "./seeds";
import { makePublicId as _makePublicId } from "./util";
export default { ..._reads, ..._writes, ..._specs, ..._seeds, makePublicId: _makePublicId };
*/
