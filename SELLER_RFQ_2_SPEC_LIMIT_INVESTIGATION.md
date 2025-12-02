# Seller RFQ Card 2-Spec Limit Investigation Report

**Date**: Investigation Report  
**Issue**: Only 2 specifications shown per item on seller RFQ cards (buyers can see more)  
**Status**: ROOT CAUSE IDENTIFIED

---

## Executive Summary

The 2-spec limit on seller RFQ cards is **enforced at the DATA ENRICHMENT layer**, not just in the UI. The limit is hardcoded in the hubgate-api worker enrichment function that processes seller RFQ data before it reaches the frontend.

---

## Files & Locations Where 2-Spec Behavior is Enforced

### Primary Root Cause

**File**: `hubgate-api/src/enrichment/enrichRfqCardRows.js`  
**Line**: 88  
**Function**: `fetchItemsPreviewData()`  
**Code**:
```javascript
// Add first 2 specs
for (const spec of specRows.slice(0, 2)) {
  const label = (spec.key_label || spec.key_norm || "").trim();
  const value = (spec.value || "").toString().trim();
  if (label && value) {
    const display = spec.unit ? `${value} ${spec.unit}`.trim() : value;
    summaryEntry.specifications[label] = display;
  }
}
```

**Impact**: This is the **DATA-LEVEL limit**. Only the first 2 specs from the database are added to each item's `specifications` object in the `itemsSummary` array.

---

## Data Flow Summary

### Seller RFQ Card Data Flow:

1. **Frontend Component**: 
   - `src/components/SellerRFQsInline.jsx` (lines 40, 150-160)
   - Calls `listSellerRFQs()` from `src/services/worker/workerRfq.js`

2. **API Call**:
   - `src/services/worker/workerRfq.js` → `listSellerRFQs()` (lines 40-72)
   - Fetches from hubgate-api endpoint: `/seller/rfqs`

3. **Hubgate API Handler**:
   - `hubgate-api/src/handlers/seller.js` → `listSellerRFQs()` (line 8)
   - Calls service: `fetchSellerRfqList()` (line 65)

4. **Service Layer**:
   - `hubgate-api/src/services/sellerRfqService.js` → `fetchSellerRfqList()` (line 7)
   - **ENRICHMENT HAPPENS HERE** (line 23): `enrichRfqCardRows(env, rows)`

5. **Enrichment Function**:
   - `hubgate-api/src/enrichment/enrichRfqCardRows.js` → `enrichRfqCardRows()` (line 111)
   - Calls `fetchItemsPreviewData()` (line 131)
   - **ROOT CAUSE**: `fetchItemsPreviewData()` limits specs to 2 (line 88)

6. **Data Mapping**:
   - `hubgate-api/src/mappers/sellerRfqCardMapper.js` → `mapSellerRfqCard()` (line 4)
   - Maps snake_case to camelCase, passes through `itemsSummary` (line 27)

7. **Frontend Display**:
   - `src/components/RFQCard.jsx` → Uses `itemsSummary` from rfq prop (line 86)
   - UI can display up to 10 specs (line 214: `.slice(0, 10)`), but only receives 2 in the data

---

## Comparison: Buyer vs Seller Enrichment

### Seller Enrichment Path (2-spec limit):
- **Location**: `hubgate-api/src/enrichment/enrichRfqCardRows.js`
- **Method**: Creates `itemsSummary` entries manually
- **Limit**: Hardcoded `specRows.slice(0, 2)` at line 88
- **Result**: Each item only has 2 specs in its `specifications` object

### Buyer Enrichment Path (10-spec limit):
- **Location**: `src/services/rfqService/enrichment.js`
- **Method**: Uses `buildSummaryEntry()` → `buildSpecRecord()`
- **Limit**: `buildSpecRecord(entries, limit = 10)` (default 10)
- **Functions Used**:
  - `src/utils/rfq/sanitizers.js` → `buildSummaryEntry()` (line 195)
  - `src/utils/rfq/sanitizers.js` → `buildSpecRecord()` (line 155)
- **Result**: Each item can have up to 10 specs in its `specifications` object

---

## UI Component Analysis

### Seller RFQ Card Component:
- **File**: `src/components/RFQCard.jsx`
- **Lines**: 211-224 (specs rendering)
- **Current Behavior**: Can display up to 10 specs (line 214: `.slice(0, 10)`)
- **Comment**: Line 244 says "Line 3: Specs (up to 10 pairs)"
- **Note**: The UI is not limiting to 2 - it's ready to display more, but the data only contains 2 specs

### Legacy Seller RFQ Card:
- **File**: `src/legacy/seller-rfq-wall/RFQCard.jsx`
- **Lines**: 193-206 (specs formatting)
- **Current Behavior**: Also slices to 10 (line 196: `.slice(0, 10)`)
- **Comment**: Line 223 says "Line 3: Specs (up to 2 pairs)" - **THIS COMMENT IS MISLEADING** - the code actually limits to 10

---

## Root Cause Explanation

**The 2-spec limit is a DATA-LEVEL limitation, not a UI limitation.**

1. **Where it happens**: In the hubgate-api worker enrichment function
2. **How it happens**: The `fetchItemsPreviewData()` function only processes the first 2 specs from the database when building `itemsSummary` entries
3. **Why sellers see 2**: The data sent to the frontend only contains 2 specs per item
4. **Why buyers see more**: Buyers use a different enrichment path that allows up to 10 specs

**Specific Code**:
```javascript
// hubgate-api/src/enrichment/enrichRfqCardRows.js:88
for (const spec of specRows.slice(0, 2)) {  // ← HARDCODED 2-SPEC LIMIT
  // ... adds spec to summaryEntry.specifications
}
```

---

## Clarification: Data Limit vs UI Limit

**CONFIRMED: This is a DATA-LEVEL limit, not just a UI display limit.**

- ✅ **Underlying data**: Seller RFQ card items in `itemsSummary` contain **only 2 specs** in the `specifications` object
- ✅ **Database has more**: The database (`rfq_item_specs` table) contains all specs for each item
- ✅ **Enrichment caps it**: The enrichment function only reads the first 2 specs from the database
- ✅ **UI can display more**: The UI components are configured to display up to 10 specs, but they never receive more than 2 in the data

**Evidence**:
- Line 88 in `hubgate-api/src/enrichment/enrichRfqCardRows.js` explicitly limits to 2: `specRows.slice(0, 2)`
- The UI at `src/components/RFQCard.jsx:214` uses `.slice(0, 10)`, indicating it can handle more
- The comment on line 244 says "up to 10 pairs" but only 2 are ever present in the data

---

## Summary

| Aspect | Details |
|--------|---------|
| **Root Cause Location** | `hubgate-api/src/enrichment/enrichRfqCardRows.js:88` |
| **Limit Type** | DATA-LEVEL (enrichment layer) |
| **Hardcoded Value** | `specRows.slice(0, 2)` |
| **Database** | Contains all specs (not limited) |
| **Seller Card Data** | Contains only 2 specs per item |
| **UI Component** | Can display up to 10 specs (limited by data) |
| **Buyer Path** | Uses different enrichment (allows up to 10 specs) |

---

## Recommendation

To allow sellers to see more than 2 specs, modify the enrichment function at:
- **File**: `hubgate-api/src/enrichment/enrichRfqCardRows.js`
- **Line**: 88
- **Change**: Replace `specRows.slice(0, 2)` with `specRows.slice(0, 10)` (or use a configurable constant)

Alternatively, align seller enrichment to use the same helper functions as buyer enrichment (`buildSummaryEntry()` and `buildSpecRecord()`) for consistency.

