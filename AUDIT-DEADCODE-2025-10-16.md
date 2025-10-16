# Dead Code Audit — summary (2025-10-16)

## Why this file?
We paused a multi-pass cleanup of unused files while testing locally (no prod deploy). This note freezes the current state so we can resume later **carefully**. Some findings are likely true positives; others are probably false positives due to dynamic usage or legacy paths. Treat all items as *candidates*, not guarantees.

---

## What we already did (Passes 1–3)
- **Quarantined (moved to `src/_archive/UNUSED-YYYY-MM-DD/`)**
  - Components: `RFQListForSeller.jsx`, `RequestCard.jsx`, `QuotationForm.jsx` (only after verifying importers)
  - Backends/Utils previously archived in pass 1 (temporarily restored as needed): `__active.js`, `products.js`, etc.
  - Hook: `hooks/useSellerRFQs.js` (no importers)
- **Build + smoke tests** stayed green after each move.
- **ESLint unused-exports** snapshots saved:
  - `AUDIT-eslint-unused.txt`, `AUDIT-eslint-unused-pass2-refresh.txt`
- **Importer checks** per batch saved:
  - `AUDIT-pass2-batch*.txt` + `*-importers.txt` + notes in `AUDIT-NOTES.md`

---

## External static analyses (do not treat as absolute truth)

### Cursor highlights (curated)
- **Dead files (not imported anywhere)** — examples:
  - `src/components/quote/CategoryGroup.jsx`
  - `src/components/quote/QuoteHeader.jsx`
  - `src/components/quote/QuoteItemRow.jsx`
  - `src/components/quote/QuoteTerms.jsx`
  - `src/components/quote/QuoteTotals.jsx`
  - `src/components/rfq-form/ReviewPanel.jsx`
  - `src/components/rfq-form/spec-editor/{index.js,logic.js,SpecEditor.jsx}`
- **Dead hooks/services clusters**
  - `src/hooks/useRFQ/` (folder) — appears unused vs the standalone `src/hooks/useRFQ.js`
  - `src/services/backends/local-idb/` (folder) — local backend disabled
  - `src/services/quotationsService/index.js` (namespace wrapper) — likely unused vs `quotationsService.js`
- **Suspicious/legacy usage**
  - `BuyerDashboard.jsx` receives props that it ignores (callers pass many props not consumed)
  - `QuotationModal.jsx` + some `useRFQ` return values look legacy/unused
  - `PreviewContext` toggles displayed but never read for conditional rendering

### Codex highlights (broad scan from `src/index.js`)
- **Counts**: 132 code files scanned; 87 reachable; **45 dead**
- Re-confirms many of the **rfq-form** and **quote/** component files as dead
- Flags multiple Supabase modules and `__active.js` as dead *in this graph* (⚠ could be false positives if imported non-statically or swapped later)
- Confirms no obvious “unused imports” in reachable files (heuristic)

> ⚠ Both tools exclude `_archive/`. They can miss **dynamic imports**, **side-effect modules**, and **runtime route/component resolution**. Always re-check before moving/deleting.

---

## Strong candidate sets (intersection is safer)
Use multiple tools before quarantining. Candidates that repeatedly appear:

**Quote components (likely safe to archive if not referenced via indirection):**
- `src/components/quote/CategoryGroup.jsx`
- `src/components/quote/QuoteHeader.jsx`
- `src/components/quote/QuoteItemRow.jsx`
- `src/components/quote/QuoteTerms.jsx`
- `src/components/quote/QuoteTotals.jsx`

**Spec editor & RFQ form sub-tree (verify current flow first):**
- `src/components/rfq-form/spec-editor/{index.js,logic.js,SpecEditor.jsx}`
- `src/components/rfq-form/{ReviewPanel.jsx,ReviewItemsList.jsx,StepHeader.jsx,VariantMatrixModal.jsx,...}`
- `src/components/rfq-form/form/{index.js,items.js,validators.js,submit.js,uiFlags.js,constants.js,navigation.js,RequiredBits.jsx}`
- `src/components/rfq-form/{BasicsSection.jsx,OrderDetailsForm.jsx,RequestForm.jsx,ReviewStep.jsx,SpecsSection.jsx,SuccessScreen.jsx,MiniCart.jsx,MobileCartSheet.jsx}`

**Hook folder (vs single-file hook):**
- `src/hooks/useRFQ/` (folder: `index.js`, `actions.js`, `useRFQList.js`, `useRFQSingle.js`, `useSafeState.js`)

**Local IDB backend (if we’re Supabase-only):**
- `src/services/backends/local-idb/{index.js,rfqs.js,specs.js,utils.js}`

**Namespace wrappers vs direct modules (double-check):**
- `src/services/quotationsService/index.js`
- `src/services/configService/index.js`

---

## Areas likely to produce false positives
- **Backend switcher**: `src/services/backends/__active.js` and friends can look “dead” to static tools but are used via indirection. We already restored what the app actually needed to build.
- **Preview flows**: `DualModeScreenPreview` vs `DualModeScreen` — some code is reachable only on preview routes.
- **Test scaffolding**: `src/App.test.js`, `src/setupTests.js` — intentionally not wired into runtime.

---

## Next time checklist (when we resume)
1. **Tooling sanity**
   - Ensure `eslint-plugin-react-refresh` is installed if `eslint.config.js` requires it.
   - If using `dependency-cruiser`, either pin `@15` (current config) or update the config to the latest schema.
2. **Re-run multi-tool scan (Pass 4 script)**
   - `scripts/audit-pass4.sh` generates:
     - `AUDIT-pass4-unimported.json` (unimported)
     - `AUDIT-pass4-knip.json` (unused files/exports)
     - `AUDIT-pass4-madge-orphans.txt` (orphans)
     - `AUDIT-pass4-depcruise.txt` (graph rules)
   - Intersect results to produce `AUDIT-pass4-strong-candidates.txt`.
3. **Human review before quarantine**
   - Search for **dynamic/indirect use** (routes, context switches, side-effects).
   - Grep for component names in **strings** (modals, registries) and **JSX tags**.
4. **Quarantine in small batches**
   - `git mv` → `_archive/UNUSED-YYYY-MM-DD/…`
   - Build + smoke test (`/__diag`, buyer/seller flows).
   - Commit with batch notes; tag versions (we used `v0.3.0-cleanup-pass*`).
5. **Refactors (optional)**
   - Either **use** the props passed into `BuyerDashboard.jsx`, or **stop passing** them.
   - Decide on `QuotationModal` + legacy `useRFQ` pieces (remove or revive).
   - Either wire `PreviewContext` values into the UI or remove the unused bits.

---

## Current status (at pause)
- Build: **green** (with a few ESLint warnings unrelated to removals).
- Pages sweep: **0 unreferenced pages** at the moment.
- Archived this round: `RFQListForSeller.jsx`, `RequestCard.jsx`, `hooks/useSellerRFQs.js` (plus earlier pass items).
- All audit artifacts committed (see `AUDIT-*` files and `AUDIT-NOTES.md`).

---

### Notes
- Treat all lists as **candidates**; confirm live usage before removal.
- Always prefer **archive** over **delete** during the cleanup phase.
- If something breaks, restore from `_archive/UNUSED-YYYY-MM-DD/…`.

— End of report.



this report was a result of 


can we stop here? and because you didn't give me cursor or codex prompt so i tried by myself, now i want you to type of a well done text file to be saved on my project so we can get back and check those outcomes some other day. because i am almost sure there are many true things in the out come but also many false, so we have to be very careful with this.

this is cursor reply:


Based on my thorough analysis of your codebase (excluding `_archive`), I've identified the following categories of dead/unused code:

### **1. Dead Files (Not Imported Anywhere)**

These files exist but are never imported by any active code:

**Components:**
- `/src/components/quote/CategoryGroup.jsx` - Imports `QuoteItemRow` but is never used itself
- `/src/components/quote/QuoteHeader.jsx` - Not imported anywhere
- `/src/components/quote/QuoteItemRow.jsx` - Only imported by the unused `CategoryGroup.jsx`
- `/src/components/quote/QuoteTerms.jsx` - Not imported anywhere
- `/src/components/quote/QuoteTotals.jsx` - Not imported anywhere
- `/src/components/rfq-form/ReviewPanel.jsx` - Not imported anywhere
- `/src/components/rfq-form/spec-editor/index.js` - Not imported anywhere
- `/src/components/rfq-form/spec-editor/logic.js` - Not imported anywhere
- `/src/components/rfq-form/spec-editor/SpecEditor.jsx` - Not imported anywhere

**Hooks:**
- `/src/hooks/useRFQ/index.js` - Exports from other useRFQ files but is never imported
- `/src/hooks/useRFQ/actions.js` - Only imported by unused `index.js`
- `/src/hooks/useRFQ/useRFQList.js` - Only imported by unused `index.js`
- `/src/hooks/useRFQ/useRFQSingle.js` - Only imported by unused `index.js`
- `/src/hooks/useRFQ/useSafeState.js` - Only imported by unused `useRFQList.js` and `useRFQSingle.js`

**Services:**
- `/src/services/backends/local-idb/index.js` - Not imported anywhere (local-idb backend is disabled)
- `/src/services/backends/local-idb/rfqs.js` - Not imported anywhere
- `/src/services/backends/local-idb/specs.js` - Not imported anywhere
- `/src/services/backends/local-idb/utils.js` - Not imported anywhere
- `/src/services/configService/index.js` - Not imported anywhere
- `/src/services/quotationsService/index.js` - Not imported anywhere (different from `quotationsService.js`)

### **2. Dead Imports (Imported but Data Not Used)**

**`BuyerDashboard.jsx` receives props but ignores them all:**
- File: `/src/components/BuyerDashboard.jsx`
- Imported in: `DualModeScreen.jsx` and `DualModeScreenPreview.jsx`
- Props passed: `buyRequests`, `userDisplayName`, `onCreateNew`, `onViewQuotations`, `onRequestStatusChange`, `onEditRequest`, `onDeleteRequest`
- **Problem**: The component accepts no props and just renders `<BuyerRFQsInline />` directly
- The props are passed but completely ignored

**`QuotationModal` is imported but likely unused:**
- File: `/src/components/QuotationModal.jsx`
- Imported in: `DualModeScreen.jsx` and `DualModeScreenPreview.jsx`
- **Problem**: The modal depends on `selectedRequest` from `useRFQ`, but the comment says "Old flow placeholder" and the actual quotation flow seems to use different components (`BuyerQuotationsViewer`, `SellerQuoteComposer`)

**`useRFQ` hook returns unused data:**
- File: `/src/hooks/useRFQ.js`
- Used in: `DualModeScreen.jsx` and `DualModeScreenPreview.jsx`
- Returns: `selectedRequest`, `quotation`, `setQuotation`, `handleSendQuotation`
- **Problem**: These are only used for the legacy `QuotationModal` which appears to be obsolete

**`PreviewContext` is never actually read:**
- File: `/src/contexts/PreviewContext.js`
- Provides: `isPreviewMode`, `previewFeatures`, and various toggle functions
- Used by: `PreviewToggle.jsx` (which displays the UI)
- **Problem**: The preview features are displayed in a toggle UI but never actually checked/used to conditionally render anything. The routes `/preview/buyer` and `/preview/seller` exist but just use different components (`DualModeScreenPreview` vs `DualModeScreen`), not based on the context values.

### **3. Entire Dead Module Trees**

**The entire `/src/hooks/useRFQ/` folder is dead:**
- Contains 5 files that form a circular dead-code tree
- They export sophisticated RFQ management hooks
- **Problem**: The app uses `/src/hooks/useRFQ.js` (the standalone file) instead, which has its own implementation
- All 5 files in the folder are unreachable

**The entire `/src/services/backends/local-idb/` folder is dead:**
- Contains 4 files for IndexedDB backend
- **Problem**: The backend switcher in `__active.js` is commented out, and the app only uses Supabase backend
- The local-idb imports are completely unreachable

**The entire spec-editor module is dead:**
- 3 files in `/src/components/rfq-form/spec-editor/`
- **Problem**: The new RFQ form uses inline spec editing in `SpecsSection.jsx` instead

### **4. Test Files**

- `/src/App.test.js` - Standard CRA test file, never imported
- `/src/setupTests.js` - Test configuration, never imported

---

## Summary Statistics

- **Dead Files**: ~25 files
- **Dead Props/Imports**: 4 major cases
- **Dead Module Trees**: 3 complete folders
- **Lines of Dead Code**: Estimated 1,500+ lines

## Recommendations

1. **High Priority**: Remove the entire `/src/hooks/useRFQ/` folder (all 5 files)
2. **High Priority**: Remove the entire `/src/components/quote/` folder except `useSellerRFQ.js` (5 component files)
3. **Medium Priority**: Remove `/src/services/backends/local-idb/` folder (4 files)
4. **Medium Priority**: Clean up `BuyerDashboard.jsx` to either use its props or update callers to stop passing them
5. **Low Priority**: Remove or fix `QuotationModal` and related legacy flow in `useRFQ.js`
6. **Low Priority**: Either use `PreviewContext` values or remove the context entirely

-- end of corsur--


and this is codex reply:

Here’s what I found by statically analyzing imports (excluding _archive/) with src/index.js as the entry:

Total code files analyzed: 132
Reachable from entry: 87
Dead files: 45
Imports where parent is dead: 50
Heuristic unused imports in reachable files: 0
Dead Files

src/components/quote/CategoryGroup.jsx
src/components/quote/QuoteHeader.jsx
src/components/quote/QuoteItemRow.jsx
src/components/quote/QuoteTerms.jsx
src/components/quote/QuoteTotals.jsx
src/components/rfq-form/BasicsSection.jsx
src/components/rfq-form/MiniCart.jsx
src/components/rfq-form/MobileCartSheet.jsx
src/components/rfq-form/OrderDetailsForm.jsx
src/components/rfq-form/RequestForm.jsx
src/components/rfq-form/ReviewItemsList.jsx
src/components/rfq-form/ReviewPanel.jsx
src/components/rfq-form/ReviewStep.jsx
src/components/rfq-form/SpecsSection.jsx
src/components/rfq-form/StepHeader.jsx
src/components/rfq-form/SuccessScreen.jsx
src/components/rfq-form/VariantMatrixModal.jsx
src/components/rfq-form/form/RequiredBits.jsx
src/components/rfq-form/form/constants.js
src/components/rfq-form/form/index.js
src/components/rfq-form/form/items.js
src/components/rfq-form/form/navigation.js
src/components/rfq-form/form/order.js
src/components/rfq-form/form/submit.js
src/components/rfq-form/form/uiFlags.js
src/components/rfq-form/form/validators.js
src/components/rfq-form/spec-editor/SpecEditor.jsx
src/components/rfq-form/spec-editor/index.js
src/components/rfq-form/spec-editor/logic.js
src/components/rfq-form/useRFQForm.js
src/hooks/useRFQ.js
src/services/backends/__active.js
src/services/backends/local-idb/index.js
src/services/backends/local-idb/rfqs.js
src/services/backends/local-idb/specs.js
src/services/backends/local-idb/utils.js
src/services/backends/supabase/categories.js
src/services/backends/supabase/events.js
src/services/backends/supabase/products.js
src/services/backends/supabase/quotations.js
src/services/backends/supabase/rfqs/seed.js
src/services/configService/index.js
src/services/quotationsService.js
src/services/rfqService.js
src/setupTests.js
Dead-Parent Imports (X imported by Y, but Y is not used)

src/App.test.js -> src/App.js via ./App
src/components/quote/CategoryGroup.jsx -> src/components/quote/QuoteItemRow.jsx via ./QuoteItemRow
src/components/rfq-form/BasicsSection.jsx -> src/components/rfq-form/form/RequiredBits.jsx via ./form/RequiredBits
src/components/rfq-form/OrderDetailsForm.jsx -> src/components/rfq-form/form/RequiredBits.jsx via ./form/RequiredBits
src/components/rfq-form/RequestForm.jsx -> src/components/rfq-form/BasicsSection.jsx via ./BasicsSection
src/components/rfq-form/RequestForm.jsx -> src/components/rfq-form/MiniCart.jsx via ./MiniCart
src/components/rfq-form/RequestForm.jsx -> src/components/rfq-form/MobileCartSheet.jsx via ./MobileCartSheet
src/components/rfq-form/RequestForm.jsx -> src/components/rfq-form/OrderDetailsForm.jsx via ./OrderDetailsForm
src/components/rfq-form/RequestForm.jsx -> src/components/rfq-form/ReviewStep.jsx via ./ReviewStep
src/components/rfq-form/RequestForm.jsx -> src/components/rfq-form/SpecsSection.jsx via ./SpecsSection
src/components/rfq-form/RequestForm.jsx -> src/components/rfq-form/StepHeader.jsx via ./StepHeader
src/components/rfq-form/RequestForm.jsx -> src/components/rfq-form/SuccessScreen.jsx via ./SuccessScreen
src/components/rfq-form/RequestForm.jsx -> src/components/rfq-form/VariantMatrixModal.jsx via ./VariantMatrixModal
src/components/rfq-form/RequestForm.jsx -> src/components/rfq-form/useRFQForm.js via ./useRFQForm
src/components/rfq-form/RequestForm.jsx -> src/utils/date.js via ../../utils/date
src/components/rfq-form/ReviewItemsList.jsx -> src/utils/rfq/itemHelpers.js via ../../utils/rfq/itemHelpers
src/components/rfq-form/ReviewStep.jsx -> src/components/rfq-form/ReviewItemsList.jsx via ./ReviewItemsList
src/components/rfq-form/ReviewStep.jsx -> src/utils/date.js via ../../utils/date
src/components/rfq-form/SpecsSection.jsx -> src/components/rfq-form/form/RequiredBits.jsx via ./form/RequiredBits
src/components/rfq-form/SpecsSection.jsx -> src/utils/rfq/rfqSpecs.js via ../../utils/rfq/rfqSpecs
src/components/rfq-form/SuccessScreen.jsx -> src/components/rfq-form/ReviewStep.jsx via ./ReviewStep
src/components/rfq-form/form/items.js -> src/components/rfq-form/form/constants.js via ./constants.js
src/components/rfq-form/form/items.js -> src/components/rfq-form/form/validators.js via ./validators.js
src/components/rfq-form/form/submit.js -> src/services/rfqService/writes.js via ../../../services/rfqService/writes
src/components/rfq-form/spec-editor/SpecEditor.jsx -> src/components/rfq-form/spec-editor/logic.js via ./logic
src/components/rfq-form/useRFQForm.js -> src/components/rfq-form/form/index.js via ./form
src/hooks/useRFQ.js -> src/hooks/useRFQ/actions.js via ./useRFQ/actions
src/hooks/useRFQ.js -> src/hooks/useRFQ/useRFQList.js via ./useRFQ/useRFQList
src/hooks/useRFQ.js -> src/hooks/useRFQ/useRFQSingle.js via ./useRFQ/useRFQSingle
src/hooks/useRFQ.js -> src/services/rfqService/index.js via ../services/rfqService
src/services/backends/__active.js -> src/services/backends/supabase.js via ./supabase
src/services/backends/local-idb/rfqs.js -> src/services/backends/local-idb/utils.js via ./utils
src/services/backends/local-idb/rfqs.js -> src/services/ids.js via ../../ids
src/services/backends/local-idb/specs.js -> src/services/backends/local-idb/rfqs.js via ./rfqs
src/services/backends/local-idb/specs.js -> src/services/backends/local-idb/utils.js via ./utils
src/services/backends/local-idb/specs.js -> src/services/ids.js via ../../ids
src/services/backends/supabase/categories.js -> src/services/backends/supabase.js via ../supabase
src/services/backends/supabase/events.js -> src/services/backends/supabase.js via ../supabase
src/services/backends/supabase/events.js -> src/utils/mappers/index.js via ../../../utils/mappers
src/services/backends/supabase/products.js -> src/services/backends/supabase.js via ../supabase
src/services/backends/supabase/products.js -> src/utils/mappers/index.js via ../../../utils/mappers
src/services/backends/supabase/quotations.js -> src/services/backends/supabase.js via ../supabase.js
src/services/backends/supabase/quotations.js -> src/utils/mappers/index.js via ../../../utils/mappers
src/services/backends/supabase/rfqs/seed.js -> src/services/backends/supabase.js via ../../supabase.js
src/services/backends/supabase/rfqs/seed.js -> src/services/ids.js via ../../../ids
src/services/configService/index.js -> src/services/backends/supabase.js via ../backends/supabase
src/services/quotationsService.js -> src/services/backends/__active.js via ./backends/__active
src/services/quotationsService.js -> src/services/backends/supabase.js via ./backends/supabase
src/services/quotationsService.js -> src/services/backends/supabase/auth.js via ./backends/supabase/auth
src/services/quotationsService.js -> src/utils/mappers/index.js via ../utils/mappers
Unused Imports

None detected in reachable files (heuristic check for imported identifiers not used elsewhere in the file body).
Notes

Scope: JS/JSX under src/, excluding src/_archive/. Entry assumed src/index.js (CRA). CSS/assets, dynamic requires, and tool-specific configs are outside scope.
Tests are not considered entrypoints; files only referenced by tests (e.g., src/App.test.js) show up in “dead-parent imports”.
Static analysis can miss dynamic usage; treat results as strong candidates and double-check before removal.

-- end of codex--






