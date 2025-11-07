Codex result:
| file | status | references | confidence | notes |
| --- | --- | --- | --- | --- |
| src/components/Header.jsx | unused | none | high | No imports anywhere; navigation wrappers inside other layouts cover this role. |
| src/components/QuotationForm.jsx | unused | `src/components/RFQListForSeller.jsx:7,58` | high | Only referenced by the unused RFQListForSeller component, so it never renders. |
| src/components/quote/CategoryGroup.jsx | unused | none | high | Seller quote UI now builds grouped lists inline; this helper isn’t imported. |
| src/components/quote/QuoteHeader.jsx | unused | none | high | Header markup lives inside `src/components/SellerQuoteComposer.jsx`, leaving this file unused. |
| src/components/quote/QuoteItemRow.jsx | unused | `src/components/quote/CategoryGroup.jsx:3,20` | high | Only consumed by the unused CategoryGroup component. |
| src/components/quote/QuoteTerms.jsx | unused | none | high | Terms section is implemented inline in SellerQuoteComposer; nothing imports this component. |
| src/components/quote/QuoteTotals.jsx | unused | none | high | Pricing totals are calculated within SellerQuoteComposer; this component never mounts. |
| src/components/RequestCard.jsx | unused | `src/components/RFQListForSeller.jsx:6,29` | high | Rendered only by RFQListForSeller, which itself is unused. |
| src/components/rfq-form/spec-editor/index.js | unused | none | high | Barrel export is never imported, so the spec-editor bundle is dead code. |
| src/components/rfq-form/spec-editor/logic.js | unused | none | high | Helper functions are referenced only by the unused SpecEditor component. |
| src/components/rfq-form/spec-editor/SpecEditor.jsx | unused | `src/components/rfq-form/spec-editor/index.js:3` | high | Only re-exported by the unused barrel; no other files import it. |
| src/components/RFQListForSeller.jsx | unused | none | high | Not imported anywhere; seller dashboards use `src/components/SellerRFQsInline.jsx` instead. |
| src/components/RoleGate.jsx | unused | none | high | Route protection relies on RequireAuth/CompanyGate in `src/App.js`, so this component is unused. |
| src/components/VisuallyHidden.jsx | unused | none | high | Screen-reader content uses Tailwind’s `sr-only` class inline, so this wrapper has no callers. |
| src/hooks/useCompanyMembership.js | unused | none | high | CompanyGate defines its own membership hook, leaving this exported hook unused. |
| src/hooks/useRFQ/actions.js | legacy-duplicate | none | high | Part of the deprecated modular useRFQ suite that was replaced by `src/hooks/useRFQ.js`. |
| src/hooks/useRFQ/index.js | legacy-duplicate | none | high | Legacy barrel for the old hook suite; current imports point to `src/hooks/useRFQ.js`. |
| src/hooks/useRFQ/useRFQList.js | legacy-duplicate | `src/hooks/useRFQ/index.js:3` | high | Only referenced inside the legacy index barrel; not used by the running app. |
| src/hooks/useRFQ/useRFQSingle.js | legacy-duplicate | `src/hooks/useRFQ/index.js:4` | high | Superseded by the hook exported from `src/hooks/useRFQ.js`; no live imports remain. |
| src/hooks/useRFQ/useSafeState.js | legacy-duplicate | `src/hooks/useRFQ/useRFQList.js:3` | high | Helper is consumed only by other legacy hook files. |
| src/hooks/useSellerRFQs.js | unused | none | high | Seller dashboards load RFQs through worker-backed services, leaving this hook unused. |
| src/legacy/seller-quote/SellerQuoteComposer.jsx | legacy-duplicate | none | high | Route `/seller/quote/:rfqId` loads `src/components/SellerQuoteComposer.jsx`, so this legacy screen is dead. |
| src/legacy/seller-quote/useSellerRFQ.js | legacy-duplicate | none | high | Active composer imports `src/components/quote/useSellerRFQ.js`; this legacy hook isn’t referenced. |
| src/legacy/seller-rfq-wall/RFQCard.jsx | legacy-duplicate | `src/legacy/seller-rfq-wall/SellerRFQsInline.jsx:7,154` | high | Only used by the legacy seller wall; current UI imports `src/components/RFQCard.jsx`. |
| src/legacy/seller-rfq-wall/SellerRFQsInline.jsx | legacy-duplicate | none | high | Superseded by `src/components/SellerRFQsInline.jsx`, which dashboards currently render. |
| src/legacy/services/rfqs/hydrateSeller.js | legacy-duplicate | none | high | Active hydration helper is `src/services/backends/supabase/rfqs/hydrateSeller.js`; this copy is unused. |
| src/legacy/services/rfqService/mapping.js | legacy-duplicate | none | high | Mapping logic now lives in `src/services/rfqService/mapping.js`; legacy version is unused. |
| src/legacy/utils/mappers/sellerHydrateMapper.js | legacy-duplicate | none | high | Active mapper resides at `src/utils/mappers/sellerHydrateMapper.js`; this file is dead. |
| src/pages/BuyerHome.js | unused | none | high | `/buyer` route renders DualModeScreen, so this placeholder page never loads. |
| src/pages/SellerHome.js | unused | none | high | `/seller` route also renders DualModeScreen; this page is obsolete. |
| src/pages/SellerRFQs.jsx | unused | none | high | No routes import it; seller RFQ listing lives inside other components. |
| src/reportWebVitals.js | unused | none | high | CRA default file remains unused because `src/index.js` never calls it. |
| src/services/backends/local-idb/db.js | unused | `src/services/backends/local-idb/rfqs.js:2` | high | Only referenced inside the dormant local IndexedDB backend. |
| src/services/backends/local-idb/index.js | unused | `src/services/backends/localIndexedDb.js:4` | high | Barrel solely feeds the unused `localIndexedDb` adapter. |
| src/services/backends/local-idb/rfqs.js | unused | `src/services/backends/local-idb/index.js:1` | high | Implementation never runs because `src/services/backends/__active.js` exports Supabase only. |
| src/services/backends/local-idb/specs.js | unused | `src/services/backends/local-idb/index.js:2` | high | Another local-backend module that is unreachable while Supabase stays active. |
| src/services/backends/local-idb/utils.js | unused | `src/services/backends/local-idb/rfqs.js:4; src/services/backends/local-idb/specs.js:3` | high | Helpers referenced only within the unused local backend. |
| src/services/backends/localIndexedDb.js | unused | none | high | Mentioned only in commented-out backend-switcher code; no live imports. |
| src/services/searchService.js | unused | none | high | No imports anywhere; search functionality uses other service modules instead. |
| src/services/worker/workerCompany.js | unused | none | high | No `import` or `new Worker` references point to this script. |
| src/setupTests.js | tooling-only | `package.json:21-24` | high | CRA’s `react-scripts test` automatically loads this setup file. |
| src/utils/quoteTotals.js | unused | none | high | Quotation totals are computed directly inside `src/hooks/useSubmitQuotation.js`. |
| src/utils/X rfqShape.js | unused | none | high | `normalizeRFQ` export is never imported; RFQ shaping happens elsewhere. |
