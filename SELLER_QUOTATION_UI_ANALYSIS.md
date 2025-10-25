# Seller Quotation UI Options Analysis

## Overview
This document catalogs all interactive UI elements available to sellers when submitting quotations in the React frontend.

---

## 1. RFQ Browsing & Selection

### Component: `RFQListForSeller` (`src/components/RFQListForSeller.jsx`)
**Purpose**: Main listing component that displays available RFQs for sellers to quote on.

#### UI Elements:
| Option Type | Label/Purpose | Description |
|------------|---------------|-------------|
| Card (clickable) | RFQ Selection | Clicking a RequestCard opens the quotation form |

### Component: `SellerRFQsInline` (`src/components/SellerRFQsInline.jsx`)
**Purpose**: Inline view of RFQs with filtering capabilities.

#### UI Elements:
| Option Type | Label/Purpose | When it appears |
|------------|---------------|-----------------|
| **Search input** | "Search title, RFQ ID, category…" | Always visible at top |
| **Checkbox** | "Open only" | Filter to show only open RFQs |
| **Checkbox** | "Compact" | Toggle dense/compact card layout |
| **Select** | "Sort by" (dropdown with options: Newest first, Oldest first, Due date soonest) | Sorting RFQ list |
| **Checkbox** | "Hide already quoted" | Hides RFQs where seller already submitted quotation |
| **Button** | "Prev" | Navigate to previous page |
| **Button** | "Next" | Navigate to next page |

### Component: `RFQCard` (`src/components/RFQCard.jsx`)
**Purpose**: Individual RFQ card display (seller audience).

#### UI Elements:
| Option Type | Label/Purpose | When it appears |
|------------|---------------|-----------------|
| **Button** | "Send quote" | Primary action on each RFQ card to initiate quotation |

### Component: `RFQToolbar` (`src/components/RFQToolbar.jsx`)
**Purpose**: Search and filter toolbar for RFQ listing.

#### UI Elements:
| Option Type | Label/Purpose | When it appears |
|------------|---------------|-----------------|
| **Search input** | Search for RFQs | Main search field |
| **Checkbox** | "Open only" | Show only open RFQs |
| **Checkbox** | "Compact" | Toggle dense layout |
| **Select** | "Sort by" | Sort options dropdown |

---

## 2. Quotation Form (Primary Submission Flow)

### Component: `QuotationForm` (`src/components/QuotationForm.jsx`)
**Purpose**: Main quotation submission form opened when seller clicks "Send quote" on an RFQ.

#### Form Fields:

| Option Type | Label | Purpose | Required | Default Value |
|------------|-------|---------|----------|---------------|
| **Select** | Currency | Currency selection | Yes | AED |
| **Number input** | Delivery timeline (days) | Days until delivery | No | 3 |
| **Number input** | Validity (days) | Quotation validity period | No | 30 |
| **Text input** | Payment terms | Payment terms description | No | "Net 30" |
| **Text input** | Shipping terms | Shipping terms description | No | "FOB Origin" |
| **Button** | Add item | Add new line item | - | - |
| **Text input** | Item | Line item name | Yes (per item) | "" |
| **Number input** | Qty | Quantity | Yes (per item) | 1 |
| **Number input** | Unit price | Price per unit | Yes (per item) | 0 |
| **Button** | Remove (trash icon) | Delete line item | - | - |
| **Textarea** | Notes | Additional seller notes | No | "" |
| **Button** | Cancel | Close form without submitting | - | - |
| **Button** | Send quote | Submit quotation | Primary action | - |

#### Line Items Management:
- **Add Line Item**: Button with "+" icon to add new item row
- **Remove Line Item**: Trash icon button for each line item
- **Auto-calculation**: Line totals (quantity × unit price) and grand total displayed

#### Footer Actions:
| Option Type | Label | Purpose |
|------------|-------|---------|
| **Button** | Cancel | Close modal without saving |
| **Button** | Send quote | Submit quotation (disabled during submission) |

---

## 3. Alternative Quotation Components

### Component: `SellerQuoteComposer` (`src/components/SellerQuoteComposer.jsx`)
**Purpose**: Alternative/simplified quotation composer (legacy or alternative flow).

#### UI Elements:
| Option Type | Label | Purpose | When it appears |
|------------|-------|---------|-----------------|
| **Link** | "← Back to Seller" | Navigation back | Top of page |
| **Text input** | Amount | Total quotation amount | Main form |
| **Select** | Currency | AED or USD | Amount field |
| **Textarea** | Notes (optional) | Additional notes | Form |
| **Button** | "Submit quotation" | Submit | Primary action |

---

### Component: `QuotationModal` (`src/components/QuotationModal.jsx`)
**Purpose**: Simple modal form for basic quotation entry.

#### UI Elements:
| Option Type | Label | Purpose | When it appears |
|------------|-------|---------|-----------------|
| **Button** | Close (X icon) | Close modal | Header |
| **Text input** | Your Price | Total price | Form |
| **Textarea** | Description | Product details/terms | Form |
| **Text input** | Delivery Timeline | Delivery time description | Form |
| **Button** | Cancel | Close without submitting | Footer |
| **Button** | Send Quote | Submit quotation | Footer |

---

## 4. Quotation Management & Viewing

### Component: `SellerQuotationsTab` (`src/components/SellerQuotationsTab.jsx`)
**Purpose**: Tab showing seller's submitted quotations.

#### UI Elements:
| Option Type | Label | Purpose | When it appears |
|------------|-------|---------|-----------------|
| **Select** | Status filter | Filter by status (All, Draft, Submitted, Accepted, Rejected) | Top of list |
| **Button** | "Browse Requests" | Navigate to RFQ listing | Empty state |
| **View action** | View Details | Open quotation viewer | Via QuotationCard |
| **Edit action** | Edit | Edit quotation | Via QuotationCard (if draft) |
| **Withdraw action** | Withdraw | Withdraw submitted quotation | Via QuotationCard (if submitted) |

---

### Component: `QuotationCard` (`src/components/QuotationCard.jsx`)
**Purpose**: Card displaying a single quotation with action menu.

#### Action Menu (Dropdown):
| Option Type | Label | Purpose | When it appears |
|------------|-------|---------|-----------------|
| **Button** | View Details | Open detailed view | Always |
| **Button** | Edit | Edit quotation | Draft or Submitted status |
| **Button** | Submit | Submit draft quotation | Draft status only |
| **Button** | Withdraw | Withdraw quotation | Submitted status only |
| **Button** | Delete | Delete quotation | Draft status only |

---

### Component: `QuotationViewer` (`src/components/QuotationViewer.jsx`)
**Purpose**: Modal showing full quotation details (read-only view).

#### UI Elements:
| Option Type | Label | Purpose | When it appears |
|------------|-------|---------|-----------------|
| **Button** | Close (X icon) | Close viewer | Header |
| **Button** | Close | Close modal | Footer |

**Note**: This is primarily a read-only display component. All editable actions are handled through QuotationCard action menu.

---

## 5. Supporting Hook: `useSubmitQuotation`

### Hook: `useSubmitQuotation` (`src/hooks/useSubmitQuotation.js`)
**Purpose**: Manages form state and validation for quotation submission.

#### Provided Functions:
- `updateField(field, value)` - Update single form field
- `updateLine(index, patch)` - Update line item
- `addLine()` - Add new line item
- `removeLine(index)` - Remove line item
- `submit()` - Submit quotation with validation

#### Validation Rules:
- Currency: Required
- Line items: At least one required
- Item name: Required per line item
- Quantity: Must be > 0 per line item
- Unit price: Must be > 0 per line item
- Delivery timeline: Must be >= 1 if provided
- Validity days: Must be >= 1 if provided

---

## Summary Matrix

### Primary Quotation Submission Actions:
1. **Browse RFQs** (`SellerRFQsInline` or `RFQListForSeller`)
2. **Click "Send quote"** on RFQ card (`RFQCard`)
3. **Fill quotation form** (`QuotationForm`)
4. **Submit quotation** ("Send quote" button in `QuotationForm`)

### Secondary/Helper Actions:
- **Search & Filter RFQs**: Search input, "Open only" checkbox, "Hide already quoted" checkbox, sort dropdown
- **Manage Quotations**: View, Edit, Withdraw, Delete (via `QuotationCard` action menu)
- **Navigate**: Back buttons, pagination (Prev/Next)

### Form Sections Breakdown:

#### `QuotationForm` - Main Form Structure:
1. **Header**: RFQ title + close button
2. **Basic Fields**: Currency, Delivery timeline, Validity, Payment terms, Shipping terms
3. **Line Items Section**: 
   - Add item button
   - Dynamic item rows (Item name, Quantity, Unit price, Calculations, Remove button)
4. **Summary**: Total price display
5. **Notes**: Optional textarea
6. **Actions**: Cancel + Send quote buttons

---

## Component Hierarchy:

```
SellerHome
├── SellerDashboard
    ├── SellerRFQsInline (activeTab="dashboard")
    │   ├── RFQToolbar (search, filters, sort)
    │   ├── RFQCard × N (each with "Send quote" button)
    │   └── Pagination (Prev/Next)
    │
    └── SellerQuotationsTab (activeTab="create")
        ├── Status filter dropdown
        ├── QuotationCard × N (with action menu)
        └── QuotationViewer (modal, opened from card)

RFQCard "Send quote" click
└── Opens QuotationForm modal
    ├── Form fields (currency, terms, line items, notes)
    └── Submit button → useSubmitQuotation hook → API call
```

---

## Key Insights:

1. **Two main flows**: 
   - Simple (`QuotationModal`) - Basic price + description
   - Full (`QuotationForm`) - Complete form with line items

2. **Primary form** (`QuotationForm`) supports:
   - Multiple line items with auto-calculation
   - All commercial terms (payment, shipping, delivery, validity)
   - Validation before submission

3. **Quote management** handled through `QuotationCard` action menu with context-aware actions based on quotation status

4. **No draft save in UI** - Quotations are submitted immediately (though "draft" status exists in backend)

5. **RFQ browsing** includes multiple filtering/searching options to help sellers find relevant RFQs

