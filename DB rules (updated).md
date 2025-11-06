/Users/hamzanazzal/Desktop/fecro.ae/DB rules (updated).md


This playbook explains how we store, secure, and work with categories, RFQs, items, and specs so the app stays simple while the database enforces the rules.
It’s written in plain English for fast onboarding—copy the snippets, run the SQL, and use the service patterns as building blocks.
Follow it end-to-end to get clean queries, safe writes (RLS), and predictable behavior from UI to DB.

****************

## 1) Data we keep
**A) categories table**
Columns:
id (uuid), parent_id (uuid | null), name (text),
path_text (text, derived), depth (int, derived; root = 0), status ('active'|'deprecated')

**Meanings:**
- parent_id: who’s the parent (root has NULL)
- path_text: breadcrumb like Electronics > Accessories > Cables
- depth: levels from root (root = 0)

**B) Business tables**
products.category_id → categories.id  
rfqs.category_id → categories.id  
We save only the id (no free-text category fields).

### 2) Single source of truth (DB owns the tree)
App never writes path_text or depth.  
On insert/update (name/parent) the database derives:
- path_text from parent.path_text + ' > ' + name  
- depth = parent.depth + 1 (or 0 for root)

DB blocks cycles (can’t parent a node under its own subtree).  
DB updates the whole subtree after a rename/move so breadcrumbs stay correct.

### 3) Uniqueness rules
- At root: no two roots with the same name (case/space-normalized).
- Among siblings: no two children under the same parent with the same name.
- Safety belt: breadcrumb (path_text) is unique once normalized.
→ This allows “Accessories” under multiple different parents, but not duplicated under the same one.

### 4) Who can edit
- Users: read the tree, select a leaf only.  
- Admins: add/move/rename/deprecate categories via an admin screen.  
- RLS enforces: read for all, writes admin-only.

### 5) Search & pick
User types “cables”.
API searches by name and breadcrumb (with proper indexes).
Show results as breadcrumbs (e.g., Electronics > Accessories > Cables).
User can select only leaves (no children).
Server re-checks (exists, active, leaf) and stores category_id.

### 6) Zero-result handling
Create row in pending_category_requests:
id, user_id, text_entered, normalized_text, status('open'|'closed'), created_at, resolved_category_id  
Protections: dedupe open requests by normalized text; rate-limit per user.

### 7) Admin workflow
Admins review open requests, assign or create new leaves, and close them.  
Prefer deprecate (and optionally redirect) over delete.

### 8) What the DB guarantees
- Derives path_text & depth (root=0)
- Prevents cycles & duplicates
- Propagates breadcrumb/level updates
- Validates leaf-only assignment
- Enforces RLS admin-only writes

### 9) Indexes
Indexes: (parent_id), (normalized name), (normalized path_text)

****************

# Part 1 — Products & Categories (Taxonomy)

We maintain two taxonomies in one table (`public.categories`):
- CUSTOM (your own)
- UNSPSC (imported from UNGM)

DB derives breadcrumbs (path_text) and depth automatically.  
App never writes derived fields.

Key columns:
id uuid (PK), name text, parent_id uuid, scheme text, path_text text, depth int.  
Triggers maintain depth/path_text, prevent loops, and propagate changes.  

**Uniqueness (scheme-aware):**
- unique roots per scheme  
- unique sibling names per scheme  
- unique full path per scheme  

**Indexes:**
```
categories_root_uni (scheme, lower(btrim(name))) WHERE parent_id IS NULL
categories_sibling_uni (scheme, parent_id, lower(btrim(name))) WHERE parent_id IS NOT NULL
categories_path_uni (scheme, lower(btrim(path_text)))
```

**UNSPSC Import Steps**
1. Stage raw nodes → `staging_unspsc_nodes`
2. Build staged breadcrumbs → `staging_category_paths`
3. Import via:
   - category_upsert_path(p_path_text, p_scheme)
   - category_import_from_staging_batch(p_scheme, p_limit)
4. Run sanity checks (depth, name matches, orphans)
5. Use views for searching (`categories_leaves_active`, `v_rfqs_with_category`)

****************

# Part 2 — Security: RLS & Security Invoker Views

**Goal:**  
Keep Supabase views safe — RLS applies everywhere.

### Key Fixes
- Converted 5 views from SECURITY DEFINER → SECURITY INVOKER
- Enabled RLS on 8 staging/audit tables
- Granted access only to `authenticated` and `service_role`
- Removed all PUBLIC/anon privileges
- Functions (like set_rfq_category) kept SECURITY DEFINER but callable only from service key

### Validation Checklist
- Normal users can’t access staging/audits
- Views show only their own rows
- Linter clean (no `security_definer_view` warnings)

****************

# Part 3 — RFQs, Items & Specifications (Normalized + Mapper)

### 0) Overview
RFQs split into:
- Header (`rfqs`)
- Items (`rfq_items`)
- Specifications (`rfq_item_specs`)

UI still sends/receives `item.specifications` as an object — DB stores rows.

---

### 1) Tables

**rfqs**
- Core RFQ header fields (title, status, order_type, etc.)
- Defaults: posted_time=now(), status='active', quotations=0, views=0

**rfq_items**
- One row per item  
- Fields: rfq_id FK, product_name, barcode, quantity, purchase_type, created_at, updated_at
- Index: (rfq_id)

**rfq_item_specs**
- One row per attribute  
- Fields: rfq_item_id FK, key_norm, key_label, value, unit  
- Unique (rfq_item_id, key_norm)
- Indexes: (rfq_item_id), (key_norm)

---

### 2) Data Flow
**Create:**
Mapper flattens RFQ header and items.  
Each spec (key/value/unit) → inserted into rfq_item_specs.  
Example: “80 grams” → value=80, unit=grams.

**Read:**
Service joins rfqs → rfq_items → rfq_item_specs  
Each item.specifications rebuilt into object.  
Seller-safe reads go via `rfq_hydrate_seller()` RPC (SECURITY INVOKER).

---

### 3) Mapper
rfqJsToDb → flattens, prunes nulls  
rfqDbToJs → hydrates RFQ and embeds items/specs

---

### 4) Why normalize specs
- Queryable & indexed
- Uniqueness per item enforced
- Editable per key
- Offline sync consistent

---

### 5) UI Contract
No UI change — still reads/writes object form.  
MiniCart and Review sections use same chips.

---

### 6) Safety & RLS
- Defaults handled by DB  
- Empty strings pruned  
- Owner RLS for CRUD  
- Sellers see only active RFQs  
- Security Invoker views ensure no leaks

---

### 7) RPC & Service Layer
`rfq_upsert_items_and_specs(_rfq_id uuid, _items jsonb)`:
- Inserts/updates items & specs atomically
- Enforces correct rfq_id
- Cleans empty values

`createRFQ()` → inserts header then calls RPC  
If RPC fails → deletes orphan header  
`updateRFQ()` → patches safely using same RPC.

---

### 8) Views
**public.v_rfq_with_items_and_specs**  
**public.v_rfq_item_specs_agg**  
→ both SECURITY INVOKER + RLS enforced  
→ SELECT granted to authenticated, service_role only

---

### 9) Testing RLS
```
SELECT set_config('request.jwt.claims',
  json_build_object('role','authenticated','sub','USER_UUID')::text, true);
SELECT auth.uid();
SELECT COUNT(*) FROM public.rfqs WHERE user_id = auth.uid();
SELECT COUNT(*) FROM public.v_rfq_with_items_and_specs WHERE user_id = auth.uid();
```

---

### 10) Migration & Cleanup
Legacy RFQs with specs in JSON backfilled into rfq_item_specs.  
Cleanup orphan RFQs:
```
DELETE FROM public.rfqs r
WHERE NOT EXISTS (SELECT 1 FROM public.rfq_items i WHERE i.rfq_id = r.id)
  AND r.created_at >= now() - interval '14 days';
```

---

# Part 4 — Supabase Security Hardening (Oct 2025)

0) **Summary:**  
Views switched to SECURITY INVOKER; RLS enabled everywhere; grants tightened.

1) **Views:**  
- v_rfqs_admin → SELECT for service_role only  
- v_rfqs_card → SELECT for authenticated + service_role  
- All others → security_invoker=true

2) **Key RLS policies:**  
- rfqs: owner can full CRUD; sellers can SELECT active RFQs  
- rfq_items: linked to parent RFQ visibility  
- rfq_item_specs: inherits from rfq_items  
- roles: self-select via user_id=auth.uid()

3) **Validation:**  
✅ service_role unrestricted  
✅ authenticated = limited  
✅ anon = blocked  
✅ verified via `auth.uid()` tests

---

# Part 5 — Updates since last version (Seller ID Migration)

- **seller_public_id** dropped  
- **seller_rfq_id (TEXT NOT NULL UNIQUE)** added  
- Auto-generated by trigger:
  ```
  trg_rfqs_set_seller_rfq_id → rfq_set_seller_rfq_id()
  ```
  → Format: SRF-XXXXXXXXXX  
- All views updated to reference `seller_rfq_id`  
- Constraint: `rfqs_seller_rfq_id_uniq`  
- Optional format check: `^SRF-[0-9A-F]{10}$`

**Result:**  
RFQs now have two distinct identifiers:
- `public_id` → buyer-facing (RFQ-####)
- `seller_rfq_id` → seller-facing (SRF-##########)

---

✅ **Final Status**
- Categories stable & searchable  
- RFQs normalized (header/items/specs)  
- RLS + views hardened  
- seller_rfq_id fully migrated  
- Safe to run validation SQLs next