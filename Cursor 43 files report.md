Cursor result:
| file | status | references | confidence | notes |
| --- | --- | --- | --- | --- |
| src/components/Header.jsx | unused | none | high | No components or routes import this header; app uses other wrappers instead. |
| src/components/QuotationForm.jsx | unused | src/components/RFQListForSeller.jsx – import | high | Only mentioned by RFQListForSeller, which is not rendered anywhere. |
| src/components/quote/CategoryGroup.jsx | unused | none | high | Quote UI revamp files exist but nothing imports this section component. |
| src/components/quote/QuoteHeader.jsx | unused | none | high | Not imported; quote flows rely on other layouts. |
| src/components/quote/QuoteItemRow.jsx | unused | src/components/quote/CategoryGroup.jsx – import | high | Used only inside CategoryGroup, and that parent is unused. |
| src/components/quote/QuoteTerms.jsx | unused | none | high | Presentational block never referenced by any screen. |
| src/components/quote/QuoteTotals.jsx | unused | none | high | No imports; totals are handled elsewhere. |
| src/components/RequestCard.jsx | unused | src/components/RFQListForSeller.jsx – import | high | Legacy seller RFQ card; current UI uses src/components/RFQCard.jsx instead. |
| src/components/rfq-form/spec-editor/index.js | unused | none | high | Barrel file is never imported, so the spec editor bundle is dead. |
| src/components/rfq-form/spec-editor/logic.js | unused | src/components/rfq-form/spec-editor/SpecEditor.jsx – import | high | Helper only feeds the unused SpecEditor component. |
| src/components/rfq-form/spec-editor/SpecEditor.jsx | unused | none | high | No forms reference this spec editor; the RFQ flow uses other controls. |
| src/components/RFQListForSeller.jsx | unused | none | high | Not routed or imported; seller dashboards now use SellerRFQsInline. |
| src/components/RoleGate.jsx | unused | none | high | Role gating is handled by RequireAuth/CompanyGate; this component has no callers. |
| src/components/VisuallyHidden.jsx | unused | none | high | Screen-reader utility isn’t imported; code uses Tailwind’s sr-only class directly. |
| src/hooks/useCompanyMembership.js | unused | none | high | CompanyGate defines an internal hook instead; nothing imports this exported version. |
| src/hooks/useRFQ/actions.js | unused | src/hooks/useRFQ/useRFQList.js – import | high | Action wrappers only support the unused useRFQ hook suite. |
| src/hooks/useRFQ/index.js | unused | none | high | No modules import this barrel; prevailing code relies on src/hooks/useRFQ.js. |
| src/hooks/useRFQ/useRFQList.js | unused | src/hooks/useRFQ/index.js – import | high | Hook isn’t consumed anywhere; list fetching lives in other hooks/components. |
| src/hooks/useRFQ/useRFQSingle.js | unused | src/hooks/useRFQ/index.js – import | high | Single-RFQ hook has no consumers; seller quote flow uses different data loaders. |
| src/hooks/useRFQ/useSafeState.js | unused | src/hooks/useRFQ/useRFQList.js; src/hooks/useRFQ/useRFQSingle.js – imports | high | Safe state helper is only referenced by the unused RFQ hook suite. |
| src/hooks/useSellerRFQs.js | unused | none | high | Seller RFQ fetching now happens in SellerRFQsInline via workerRfq service; this hook is orphaned. |
| src/legacy/seller-quote/SellerQuoteComposer.jsx | legacy-duplicate | none | high | Active router points to src/components/SellerQuoteComposer.jsx; this legacy copy is abandoned. |
| src/legacy/seller-quote/useSellerRFQ.js | legacy-duplicate | src/legacy/seller-quote/SellerQuoteComposer.jsx – import | high | Only legacy composer references it; current flow uses src/components/quote/useSellerRFQ.js. |
| src/legacy/seller-rfq-wall/RFQCard.jsx | legacy-duplicate | src/legacy/seller-rfq-wall/SellerRFQsInline.jsx – import | high | Replaced by src/components/RFQCard.jsx; no active imports. |
| src/legacy/seller-rfq-wall/SellerRFQsInline.jsx | legacy-duplicate | none | high | Superseded by src/components/SellerRFQsInline.jsx; not used in routing. |
| src/legacy/services/rfqs/hydrateSeller.js | legacy-duplicate | src/legacy/seller-quote/useSellerRFQ.js – import | high | Active hydration lives in src/services/backends/supabase/rfqs/hydrateSeller.js. |
| src/legacy/services/rfqService/mapping.js | legacy-duplicate | none | high | Mapping logic now resides in src/services/rfqService/mapping.js; this copy is unused. |
| src/legacy/utils/mappers/sellerHydrateMapper.js | legacy-duplicate | src/legacy/services/rfqs/hydrateSeller.js – import | high | Active mapper is src/utils/mappers/sellerHydrateMapper.js. |
| src/pages/BuyerHome.js | unused | none | high | Router directs buyers to DualModeScreen; this placeholder page is never mounted. |
| src/pages/SellerHome.js | unused | none | high | Seller route also points to DualModeScreen; this stub isn’t used. |
| src/pages/SellerRFQs.jsx | unused | none | high | No routes render this page; seller listing is handled inside DualModeScreen. |
| src/reportWebVitals.js | unused | none | high | CRA default file, but src/index.js no longer imports it. |
| src/services/backends/local-idb/db.js | unused | src/services/backends/local-idb/rfqs.js – import | high | Part of the IndexedDB backend that isn’t selected anywhere. |
| src/services/backends/local-idb/index.js | unused | src/services/backends/localIndexedDb.js – re-export | high | Barrel only feeds the unused localIndexedDb wrapper. |
| src/services/backends/local-idb/rfqs.js | unused | src/services/backends/local-idb/index.js – re-export | high | IndexedDB RFQ adapter isn’t wired into the active backend switch. |
| src/services/backends/local-idb/specs.js | unused | src/services/backends/local-idb/index.js – re-export | high | Spec helpers belong to the dormant local IndexedDB backend. |
| src/services/backends/local-idb/utils.js | unused | src/services/backends/local-idb/db.js; src/services/backends/local-idb/rfqs.js; src/services/backends/local-idb/specs.js – imports | high | Utility module only serves the unused local IndexedDB backend. |
| src/services/backends/localIndexedDb.js | unused | none | high | Wrapper is only referenced in commented-out backend-switcher code; never imported at runtime. |
| src/services/searchService.js | unused | none | high | No code calls suggest(); search features rely on other pathways. |
| src/services/worker/workerCompany.js | unused | none | high | Worker endpoints for companies aren’t imported from UI or services. |
| src/setupTests.js | tooling-only | auto-loaded by react-scripts test | high | CRA’s test command loads this file automatically. |
| src/utils/quoteTotals.js | unused | none | high | Totals helper isn’t imported; seller quote flow computes totals elsewhere. |
| src/utils/X rfqShape.js | unused | none | high | Normalizer isn’t referenced; RFQ typing lives in other utilities. |


take 2, better answer maybe:


[105 tools called]

## Usage Analysis

- file: `src/components/Header.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/components/QuotationForm.jsx`; found_imports: ["src/components/RFQListForSeller.jsx: import QuotationForm from './QuotationForm'"]; via: static-import (extensionless); conclusion: only referenced by other unused/legacy files; confidence: high  
- file: `src/components/quote/CategoryGroup.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/components/quote/QuoteHeader.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/components/quote/QuoteItemRow.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/components/quote/QuoteTerms.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/components/quote/QuoteTotals.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/components/RequestCard.jsx`; found_imports: ["src/components/RFQListForSeller.jsx: import RequestCard from './RequestCard'"]; via: static-import (extensionless); conclusion: only referenced by other unused/legacy files; confidence: high  
- file: `src/components/rfq-form/spec-editor/index.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/components/rfq-form/spec-editor/logic.js`; found_imports: ["src/components/rfq-form/spec-editor/SpecEditor.jsx: import { hasText, normalizeSpec, specToInlineText, isDupe } from './logic'"]; via: static-import (extensionless); conclusion: only referenced by other unused/legacy files; confidence: high  
- file: `src/components/rfq-form/spec-editor/SpecEditor.jsx`; found_imports: ["src/components/rfq-form/spec-editor/index.js: export { default } from './SpecEditor.jsx'"]; via: static-import (re-export); conclusion: only referenced by other unused/legacy files; confidence: high  
- file: `src/components/RFQListForSeller.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/components/RoleGate.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/components/VisuallyHidden.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/hooks/useCompanyMembership.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/hooks/useRFQ/actions.js`; found_imports: ["src/hooks/useRFQ/index.js: import * as rfqActions from './actions'"]; via: static-import (extensionless); conclusion: used in active runtime code; confidence: high  
- file: `src/hooks/useRFQ/index.js`; found_imports: ["src/pages/DualModeScreen.jsx: import useRFQ from '../hooks/useRFQ'","src/pages/DualModeScreenPreview.jsx: import useRFQ from '../hooks/useRFQ'"]; via: static-import (folder import to index); conclusion: used in active runtime code; confidence: high  
- file: `src/hooks/useRFQ/useRFQList.js`; found_imports: ["src/hooks/useRFQ/index.js: import { useRFQList, useRFQs } from './useRFQList'"]; via: static-import (extensionless); conclusion: used in active runtime code; confidence: high  
- file: `src/hooks/useRFQ/useRFQSingle.js`; found_imports: ["src/hooks/useRFQ/index.js: import { useRFQ } from './useRFQSingle'"]; via: static-import (extensionless); conclusion: used in active runtime code; confidence: high  
- file: `src/hooks/useRFQ/useSafeState.js`; found_imports: ["src/hooks/useRFQ/useRFQList.js: import { useSafeState } from './useSafeState'","src/hooks/useRFQ/useRFQSingle.js: import { useSafeState } from './useSafeState'"]; via: static-import (extensionless); conclusion: used in active runtime code; confidence: high  
- file: `src/hooks/useSellerRFQs.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/legacy/seller-quote/SellerQuoteComposer.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/legacy/seller-quote/useSellerRFQ.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/legacy/seller-rfq-wall/RFQCard.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/legacy/seller-rfq-wall/SellerRFQsInline.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/legacy/services/rfqs/hydrateSeller.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/legacy/services/rfqService/mapping.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/legacy/utils/mappers/sellerHydrateMapper.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/pages/BuyerHome.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/pages/SellerHome.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/pages/SellerRFQs.jsx`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/reportWebVitals.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/services/backends/local-idb/db.js`; found_imports: ["src/services/backends/local-idb/rfqs.js: import db from './db'","src/services/backends/local-idb/specs.js: import db from './db'"]; via: static-import (extensionless); conclusion: only referenced by other unused/legacy files; confidence: high  
- file: `src/services/backends/local-idb/index.js`; found_imports: ["src/services/backends/localIndexedDb.js: export * from './local-idb/index'"]; via: static-import (re-export, extensionless); conclusion: only referenced by other unused/legacy files; confidence: high  
- file: `src/services/backends/local-idb/rfqs.js`; found_imports: ["src/services/backends/local-idb/index.js: export * from './rfqs'","src/services/backends/local-idb/specs.js: import { getRFQ } from './rfqs'"]; via: static-import (extensionless); conclusion: only referenced by other unused/legacy files; confidence: high  
- file: `src/services/backends/local-idb/specs.js`; found_imports: ["src/services/backends/local-idb/index.js: export * from './specs'"]; via: static-import (extensionless); conclusion: only referenced by other unused/legacy files; confidence: high  
- file: `src/services/backends/local-idb/utils.js`; found_imports: ["src/services/backends/local-idb/rfqs.js: import { _splitValueUnit, _normKeyPair } from './utils'","src/services/backends/local-idb/specs.js: import { _normalizeKey, _splitValueUnit, _normKeyPair } from './utils'"]; via: static-import (extensionless); conclusion: only referenced by other unused/legacy files; confidence: high  
- file: `src/services/backends/localIndexedDb.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/services/searchService.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/services/worker/workerCompany.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/setupTests.js`; found_imports: ["package.json: \"test\": \"react-scripts test\" (CRA auto-loads src/setupTests.js)"]; via: tooling-config; conclusion: used only by tests/tooling; confidence: high  
- file: `src/utils/quoteTotals.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high  
- file: `src/utils/X rfqShape.js`; found_imports: none; via: none; conclusion: no usage found anywhere; confidence: high