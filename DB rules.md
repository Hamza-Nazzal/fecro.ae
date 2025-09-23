




This playbook explains how we store, secure, and work with categories, RFQs, items, and specs so the app stays simple while the database enforces the rules.
It’s written in plain English for fast onboarding—copy the snippets, run the SQL, and use the service patterns as building blocks.
Follow it end-to-end to get clean queries, safe writes (RLS), and predictable behavior from UI to DB.



****************

1) Data we keep
A) categories table
Columns:
id (uuid), parent_id (uuid | null), name (text),
path_text (text, derived), depth (int, derived; root = 0), status ('active'|'deprecated')
Meanings:
parent_id: who’s the parent (root has NULL)
path_text: breadcrumb like Electronics > Accessories > Cables
depth: levels from root (root = 0)
B) Business tables
products.category_id → categories.id
rfqs.category_id → categories.id
We save only the id (no free-text category fields).
2) Single source of truth (DB owns the tree)
App never writes path_text or depth.
On insert/update (name/parent) the database derives:
path_text from parent.path_text + ' > ' + name
depth = parent.depth + 1 (or 0 for root)
DB blocks cycles (can’t parent a node under its own subtree).
DB updates the whole subtree after a rename/move so breadcrumbs stay correct.
3) Uniqueness rules (clear & practical)
At root: no two roots with the same name (case/space-normalized).
Among siblings: no two children under the same parent with the same name.
Safety belt: breadcrumb (path_text) is unique once normalized.
→ This allows “Accessories” under multiple different parents, but not duplicated under the same one.
4) Who can edit
Users: read the tree, select a leaf only.
Admins: add/move/rename/deprecate categories via an admin screen.
RLS enforces: read for all, writes admin-only.
5) Search & pick (user flow)
User types “cables”.
API searches by name and breadcrumb (with proper indexes).
Show results as breadcrumbs (e.g., Electronics > Accessories > Cables, Music > Accessories > Cables).
User can select only leaves (no children).
Server re-checks (exists, active, leaf) and stores category_id.
6) Zero-result handling
Create a row in pending_category_requests:
id, user_id, text_entered, normalized_text, status('open'|'closed'), created_at, resolved_category_id
Protections: dedupe open requests by normalized text; rate-limit per user.
Users see their own requests; admins see all.
7) Admin workflow
Review open requests.
Either assign to an existing leaf or create a new leaf under the right parent.
Close the request (optionally link the final category_id).
Prefer deprecate (and optionally redirect) over deleting live categories.
8) What the DB guarantees (so app stays simple)
Derives path_text & depth (root=0) on every change.
Prevents cycles and duplicate names where they shouldn’t exist.
Propagates breadcrumb/level updates to all descendants on move/rename.
Validates leaf-only assignment on saves to products/RFQs (exists, active, leaf).
9) Performance basics
Indexes on parent_id (child lookups), normalized name, and normalized path_text (for search).
Paginate search results (e.g., top 25).
Schedule big tree edits off-peak if a large subtree is moved/renamed.
10) Example (easy to visualize)
Two “Cables” exist:
Electronics > Accessories > Cables (depth = 2)
Music > Accessories > Cables (depth = 2)
User searches “cables”, sees both paths, picks one; we save that id.
If admin later renames “Accessories” under Electronics, the breadcrumb updates automatically; the id used by products/RFQs still points to the same node.
11) Trade-offs (intentional)
Users can’t edit the tree (admin-only → safer).
App treats path_text & depth as read-only (less room for bugs).
Moving/renaming a big branch rewrites many rows (admin operation, planned).
Prefer deprecation over delete to protect existing references.
12) Migration note (if you used depth=1 before)
One-time: depth := depth - 1 for every row.
Update any checks/docs/tests to root=0.
No change to user flows.
13) “Done” checklist
 Root nodes show depth = 0.
 Creating/moving/renaming nodes auto-updates path_text & depth (and descendants).
 Duplicate names allowed across different parents, blocked within the same parent.
 Users can select only leaves; server validates on save.
 Zero-result requests are deduped and rate-limited.
 RLS blocks non-admin writes to the tree.











 **************** what we did with products/categories ****************









Part 1 — Products & Categories (Taxonomy)
0) What we’re building (plain English)
We keep two taxonomies side-by-side:
CUSTOM (your own)
UNSPSC (imported from UNGM)
One table, public.categories, stores the tree (roots → children → leaves).
The database is the single source of truth. It derives breadcrumbs (path_text) and depth automatically.
The app never writes derived fields; it only stores category_id on RFQs/Products and reads breadcrumbs via a join.
Key columns/rules in public.categories
id uuid (PK)
name text (trimmed)
parent_id uuid NULL (self-FK; root rows have NULL)
scheme text ('CUSTOM' or 'UNSPSC')
path_text text (derived breadcrumb, e.g., Electronics > Cables > HDMI)
depth int (derived; root = 0)
Triggers maintain path_text and depth, prevent self/loop cycles, and propagate changes down the subtree.
Uniqueness is scheme-aware:
unique root names per scheme
unique sibling names per scheme
unique full breadcrumb per scheme
We already created the scheme-aware unique indexes:
categories_root_uni (scheme, lower(btrim(name))) WHERE parent_id IS NULL
categories_sibling_uni (scheme, parent_id, lower(btrim(name))) WHERE parent_id IS NOT NULL
categories_path_uni (scheme, lower(btrim(path_text)))
1) Import UNSPSC (from your Excel/CSV)
1.1 Stage the raw nodes
Your file is node-based (Key, Parent key, Code, Title). We loaded it into:
public.staging_unspsc_nodes(node_key text PK, parent_key text NULL, code text, title text)
We normalized keys (strip spaces/non-digits) and logged orphans (rows whose parent wasn’t present) in:
public.staging_unspsc_orphans(node_key, parent_key, node_key_norm, parent_key_norm, title)
Seeing a small number of orphans (e.g., 18) is fine — we skip those subtrees until you provide the parents.
1.2 Build human paths to stage
From the node table we generated leaf-only breadcrumbs into:
public.staging_category_paths(scheme text, path_text text, processed_at timestamptz NULL)
with scheme='UNSPSC'. Each path_text looks like:
Business, Communication & Technology Equipment & Supplies > ... > Personal communication devices > IP phones
1.3 Import staged paths to the real tree
We used two helper functions:
category_upsert_path(p_path_text, p_scheme)
Splits the breadcrumb, finds or creates each node under (scheme, parent, name), and returns the leaf id.
category_import_from_staging_batch(p_scheme, p_limit)
Processes staged paths in batches (e.g., 2,000 rows per call) to avoid timeouts. We called this repeatedly until it returned 0.
Result: UNSPSC is inside public.categories next to your CUSTOM nodes; triggers filled depth/path_text.
2) Sanity checks (you should re-run after any big import)
Depth vs breadcrumb: depth equals the number of > in path_text. Expect 0 bad rows.
Leaf name matches last breadcrumb segment: last segment of path_text (after the final >) must equal name (case/trim insensitive). Expect 0 bad rows.
Parent integrity: no row should reference a missing parent. Expect 0.
Distribution: inspect counts by depth and total leaves (just for a feel; our result looked healthy: depths 0…6).
3) App-facing views & search
Active leaves view (what the UI searches/picks from):
public.categories_leaves_active → all is_active=true rows that have no children in the same scheme.
Convenience views with breadcrumbs:
public.v_rfqs_with_category → RFQs + scheme + path_text
public.v_products_with_category → Products + scheme + path_text
Search RPC (optional helper if you prefer RPC over table reads):
public.categories_search(q TEXT, in_scheme TEXT=NULL, in_limit INT=25)
Returns (id, scheme, path_text) for matching active leaves.
The UI should only send/keep category_id when creating/updating RFQs/Products.
For display, it selects categories:category_id(name, path_text, scheme) or uses the views above.
4) Suggesting categories (RFQs/Products)
When legacy category/sub_category text was missing or messy, we built a suggestion pipeline:
4.1 Suggestion tables
RFQs → public.staging_rfq_category_candidates
Products → public.staging_product_category_candidates
Each row stores:
item_id (rfq_id/product_id), scheme, category_id, path_text, score, rank_in_*
4.2 How scores are computed
We used pg_trgm similarity and a blend:
70% similarity between the item title and the leaf name
30% similarity between the item title and the full path
We kept top 10 candidates per item with a score filter (e.g., > 0.2) and previewed results.
4.3 Safe auto-apply (optional)
We applied very conservative rules for RFQs (you can reuse for Products):
Prefer CUSTOM if top score ≥ 0.45 and not worse than UNSPSC by > 0.05.
Else, prefer UNSPSC if top score ≥ 0.60 and ahead of CUSTOM by ≥ 0.10.
Otherwise leave category_id NULL for manual review.
All changes are recorded in audit tables:
public.rfq_category_audit
public.product_category_audit
We also created review views with top 5 suggestions:
public.v_rfq_category_suggestions
public.v_product_category_suggestions
4.4 Manual assignment (audited)
public.set_rfq_category(rfq_id, category_id, reason='manual')
public.set_product_category(product_id, category_id, reason='manual')
These only allow active leaf categories, and write to audit before updating the item.
5) Hide/restore parts of the tree
Sometimes you want to temporarily remove categories (or entire families) from search without breaking existing links.
public.category_set_active(category_id, is_active, reason)
Toggles is_active for the whole subtree (the node + all descendants).
Because the UI searches categories_leaves_active, hidden branches immediately disappear from pickers (but historical RFQs/Products linked to those ids still work).
6) Admin maintenance you can run any time
Refresh UNSPSC:
Replace CSV in staging_unspsc_nodes.
Recompute staging_unspsc_orphans.
Rebuild staged leaf paths in staging_category_paths (scheme='UNSPSC').
Import in batches with category_import_from_staging_batch('UNSPSC', 2000) until it returns 0.
Re-run the sanity checks.
Import or edit CUSTOM:
Insert paths into staging_category_paths (scheme='CUSTOM'), then import with the same batch function.
Suggestions (re-run after titles change):
Truncate the suggestion tables, regenerate candidates, inspect, optionally apply.
Everything above is idempotent and batched to avoid timeouts.
                            ****************
Part 2 — Security: RLS & Security Invoker Views
0) Goal (plain English)
Make sure views don’t accidentally use the creator’s permissions (that’s unsafe).
Make sure staging/audit tables aren’t open to app users.
Keep end-user reads safe via RLS (row-level security).
1) What we changed on views
Problem: The linter flagged 5 views as “security_definer_view”.
Fix: We switched them to security invoker so they evaluate using the caller’s RLS/permissions:
public.categories_leaves_active
public.v_rfqs_with_category
public.v_products_with_category
public.v_rfq_category_suggestions
public.v_product_category_suggestions
Result: the linter errors for those views are gone, and the views now respect whoever is querying them.
2) RLS on staging & audit tables
Problem: 8 public tables had RLS disabled.
Tables:
staging_unspsc_nodes
staging_unspsc_orphans
staging_unspsc
staging_category_paths
staging_rfq_category_candidates
staging_product_category_candidates
rfq_category_audit
product_category_audit
Fix:
Enabled RLS on all 8 tables.
Added one least-privilege policy per table (named admin_rw) that allows access only if:
the JWT has app_role='admin', or
the request uses the service_role key (server key).
We attached the policies to the authenticated role; anon has no policy, so it gets no access to those tables at all.
End-user reads go through invoker views that query base/category tables with their own RLS.
3) Grants (who can even try to touch those tables)
We revoked all privileges from PUBLIC and anon on the staging/audit tables.
We granted the minimum needed to authenticated and service_role, and then relied on RLS to block non-admins:
Staging: SELECT, INSERT, UPDATE, DELETE for authenticated; full for service_role.
Audits: SELECT, INSERT for authenticated; full for service_role.
We trimmed unnecessary privileges (e.g., removed TRIGGER, TRUNCATE, REFERENCES from authenticated) to reduce surface area.
Views: we granted SELECT on the 5 views to anon, authenticated, and service_role.
Because the views are security invoker, RLS still applies correctly.
4) Supabase-specific notes (important, to avoid blind spots)
The policy condition we used:
auth.role() = 'service_role' OR (auth.jwt()->>'app_role') = 'admin'
service_role is the server key (only used on your backend).
app_role='admin' is a custom JWT claim you can put on trusted admin users.
SECURITY DEFINER functions (like set_rfq_category) can bypass RLS.
To keep them safe you must do one of these:
Do not grant EXECUTE on those functions to end users; call them only with the service key from your server.
OR
Add an admin check inside the function body (we showed how earlier) and only then GRANT EXECUTE to authenticated.
Either approach is fine. The simplest is to call write-RPCs from your server using the service key (no extra grants).
5) How to validate (quick tests)
Views show invoker security: select from them as a normal user and as admin — results should differ if RLS differs.
RLS is on: querying staging/audit tables without app_role='admin' should return 0 rows (or errors), even if the user has table grants.
Linter passes: security_definer_view and rls_disabled_in_public cleared.
6) Everyday security workflow
End-users read via the invoker views (RLS enforced).
Admins do heavy tasks (refresh UNSPSC, hide subtrees, manual assign) using:
The service key on the server, or
A JWT with app_role='admin' if you add admin UI.
Before each UNSPSC refresh:
Re-stage nodes,
Rebuild staged leaf paths,
Import in batches,
Run sanity checks.
7) Common pitfalls to avoid
Writing path_text or depth from the app — don’t; the DB derives them.
Using non-leaf categories for assignment — our functions prevent that; always assign a leaf.
Forgetting to batch imports — large inserts can time out; use the batch importer repeatedly.
Granting EXECUTE on SECURITY DEFINER write functions to everyone — don’t; keep them server-only or enforce admin checks.
Letting the UI read staging/audit tables — don’t; these are admin-only and RLS-guarded.
8) What a new teammate needs (at a glance)
Tables: categories, rfqs, products, the staging tables, and audit tables.
Views: categories_leaves_active, v_rfqs_with_category, v_products_with_category, v_rfq_category_suggestions, v_product_category_suggestions.
Functions:
Import: category_upsert_path, category_import_from_staging_batch
Admin: category_set_active, categories_search (optional)
Manual assignment: set_rfq_category, set_product_category
RLS: Enabled on staging/audits; policies allow only service_role or app_role=admin.
App rule: store only category_id; for display, join categories to get breadcrumb.

****************************************************************



**************** what we did with RFQs / Items / Specs ****************

Part 3 — RFQs, Items & Specifications (Normalized + Mapper)

0) What we’re building (plain English)
We split an RFQ into:
- RFQ header (the overall request)
- RFQ items (each product line)
- Item specifications (attributes like color, size; unit is optional)
UI still sees item.specifications as an object.  
DB stores them as rows (clean, queryable).

1) Tables (source of truth)

A) public.rfqs — the header
Columns: id, public_id, title, description, category, sub_category, category_id,
quantity (summary, optional), order_type, delivery_time, custom_date (DATE),
delivery, incoterms, payment, warranty, installation,
posted_time, status, quotations, views, user_id, created_at
Defaults: posted_time=now(), status='active', quotations=0, views=0,
company has a default string.
Meaning: only RFQ-level fields live here (not per-item).

B) public.rfq_items — one row per line item
Columns: id, rfq_id (FK→rfqs.id), product_name, category, category_path, barcode,
quantity (per item), purchase_type, created_at, updated_at
Index: (rfq_id)

C) public.rfq_item_specs — one row per attribute (EAV)
Columns: id, rfq_item_id (FK→rfq_items.id),
key_norm (lower/trim/underscored), key_label (human label),
value (string), unit (optional), created_at, updated_at
Uniqueness: (rfq_item_id, key_norm) — prevents duplicate keys on the same item
Indexes: (rfq_item_id), (key_norm)

2) Data flow (create / read)

Create:
- UI submits {title?, orderDetails, items[]}
- Mapper flattens orderDetails → rfqs columns, omits nulls (defaults apply)
- Each item → rfq_items row
- Each item.specifications → rfq_item_specs rows
- Example: “80 grams” → value=80, unit=grams

Read:
- Service selects rfqs with rfq_items + rfq_item_specs
- Each item.specs rebuilt into object
- If value+unit → format “80 grams”
- UI unchanged

3) Mapper (single source of truth)

rfqJsToDb(js):
- Flattens title/description/category/subCategory/categoryId/quantity/orderType/
  deliveryTime|deliveryTimeline/customDate/delivery/incoterms/payment|paymentTerms/
  warranty/installation
- Sanitizers: ""→NULL, parse dates/numbers, null/undefined pruned

rfqDbToJs(db):
- Returns full RFQ
- Adds orderDetails for convenience

4) Why normalize specs

- Searchable: query key/value directly
- Constraints: uniqueness per (item, key_norm)
- Updates: edit one spec without touching others
- Offline: same shape in IndexedDB

5) UI contract (unchanged feel)

- Items still expose item.specifications as an object
- Add custom attribute → normalized key, keep label, store value + optional unit
- MiniCart/Review render spec chips same as before

6) Defaults & safety

- Mapper omits NULLs where defaults exist (posted_time, status, quotations, views, company)
- Empty strings → NULL
- DB fills defaults safely
- RLS + triggers continue to apply

7) Required vs optional (recommended UI rules)

Header (required): title (≥2 chars), order_type, category (id or string)
Header (optional): quantity summary, delivery_time, incoterms, payment, warranty, installation
Per item (required): product_name, quantity
Per item (optional): specs (with unit if numeric)

8) Nice to have (future)

- rfq_specs table (RFQ-level specs)
- spec_templates(category_prefix, key_norm, key_label) for suggested attributes
- Offline IndexedDB sync
- Category-driven spec templates

9) Migration note (one-off)

- Legacy RFQs with embedded specs (JSON) → backfill into rfq_item_specs
- One row per key/value
- Normalize key, split unit if present

10) Example (easy to visualize)

RFQ “A4 Paper”
rfqs:
- title='A4 Paper Bulk', order_type='one-time', delivery_time='standard',
  incoterms='EXW', payment='net-30'
rfq_items:
- product_name='A4 Copy Paper', quantity=100, purchase_type='one-time'
- product_name='A4 Recycled Paper', quantity=150, purchase_type='one-time'
rfq_item_specs:
- (item #1) key_norm='gsm', value='80', unit='g/m²'
- (item #1) key_norm='color', value='white'
- (item #2) key_norm='material', value='recycled'

11) Trade-offs (intentional)

- More rows/joins vs JSON → more complex writes
- But: queries, constraints, updates are safer
- Header vs item kept separate (no auto-copy)

12) Testing checklist

- Create RFQ: header saved, defaults applied
- Items saved in rfq_items
- Specs saved in rfq_item_specs, unique per item
- Update: omit null → keeps old value
- Specs: add/update/delete all work

13) “Done” checklist

- RFQ header normalized, defaults apply
- Items stored in rfq_items
- Specs normalized in rfq_item_specs
- UI reads item.specifications as object
- Unique (rfq_item_id, key_norm) enforced
- Add/update/remove spec helpers consistent
- Legacy/demo data backfilled or validated


14) RPC & Service Layer (atomic upserts)
We don’t insert RFQ + items/specs separately from the UI.
Instead we rely on a Postgres RPC (rfq_upsert_items_and_specs) to do:
Insert/update items under a given RFQ
Insert/update specs under each item
Enforce rfq_id belongs to the RFQ (no cross-contamination)
Why: keeps items/specs consistent, avoids UI writing to 3 tables manually.
Client-side service (rfqService.js):
createRFQ(rfq):
Inserts RFQ header row (public.rfqs)
Calls RPC with sanitized items (no id / rfqId on brand new RFQs)
If RPC fails → delete the orphan header row (so no “empty RFQs” left)
updateRFQ(id, updates):
Updates header if fields changed
Calls RPC with sanitized items
Includes id only if the item really belongs to this RFQ (safety)
Benefit: Prevents the “item does not belong to rfq” errors, prevents orphan records.
15) Sanitization rules (service layer)
Create: Strip all id and rfqId fields → brand new RFQ items always fresh.
Update: Only keep id if (item.rfqId == rfq.id) → avoids accidentally updating another RFQ’s item.
Common fields: product_name, category_path, quantity, purchase_type, barcode, specifications.
Defaults: quantity=1 if missing, purchase_type='one-time' if missing.
16) Orphans cleanup
Problem: before compensating delete, failed RPC calls left rows in public.rfqs with no items.
Fix: createRFQ now deletes the header if RPC fails.
Extra: you can run a cleanup script to remove old orphans (e.g. DELETE FROM rfqs WHERE NOT EXISTS (SELECT 1 FROM rfq_items ...)).
17) Views (for simplified reads)
We created two views to simplify selecting RFQs + items + specs:
public.v_rfq_with_items_and_specs
Denormalized “RFQ header + embedded items/specs”
Columns: id, public_id, company, title, …, user_id, created_at, …, items_with_specs
Exposes user_id → useful for RLS filtering.
public.v_rfq_item_specs_agg
Aggregates specs per item into one row (rfq_id, rfq_item_id, specifications)
Easier to render items with their specs in one query.
UI impact: The frontend can query views instead of manually joining 3 tables.
18) Security (views + RLS)
By default, these views were created with SECURITY DEFINER.
That means queries run with the creator’s permissions, bypassing RLS.
Dangerous, because any logged-in user could see other users’ RFQs.
Fix: switched them to SECURITY INVOKER (ALTER VIEW … SET (security_invoker=on)).
Now, views run with the caller’s rights.
RLS on public.rfqs applies as expected.
Grants tightened:
REVOKE ALL … FROM PUBLIC
GRANT SELECT … TO authenticated, service_role
No direct access for anon (unless intentionally allowed)
19) Testing RLS with views
Simulated an authenticated user by setting session claims:
select set_config(
  'request.jwt.claims',
  json_build_object('role','authenticated','sub','USER_UUID')::text,
  true
);
select auth.uid();  -- shows USER_UUID
Verified:
Base rfqs table only shows rows where user_id = auth.uid()
Views (v_rfq_with_items_and_specs, v_rfq_item_specs_agg) respect the same rules (no leaks)
20) Trade-offs & Future Work
Current setup: insert header then RPC → 2 calls, with compensating delete if RPC fails.
Ideal future: a single transaction function, e.g. rfq_create_with_items_and_specs, wrapping header+items+specs in one RPC.
Benefits: no risk of orphans, even temporarily.
Downsides: more work writing/maintaining SQL, but cleaner.

****************************************************************

**************** what we did with RFQs / Items / Specs ****************
Part 3 — RFQs, Items & Specifications (Normalized + Mapper)
What we’re building (plain English)
We split an RFQ into:
RFQ header (the overall request)
RFQ items (each product line)
Item specifications (attributes like color, size; unit is optional)
UI still treats item.specifications as a simple object.
DB stores specs as rows (clean, queryable, constrained).
Tables (source of truth)
A) public.rfqs — the header
Columns: id, public_id, title, description, category, sub_category, category_id, quantity (summary, optional), order_type, delivery_time, custom_date (DATE), delivery, incoterms, payment, warranty, installation, posted_time, status, quotations, views, user_id, created_at
Defaults: posted_time=now(), status='active', quotations=0, views=0, company has a default.
Meaning: only RFQ-level fields live here (not per-item).
B) public.rfq_items — one row per line item
Columns: id, rfq_id (FK→rfqs.id), product_name, category, category_path, barcode, quantity (per item), purchase_type, created_at, updated_at
Index: (rfq_id)
C) public.rfq_item_specs — one row per attribute (EAV)
Columns: id, rfq_item_id (FK→rfq_items.id), key_norm (lower/trim/underscored), key_label (human label), value (string), unit (optional), created_at, updated_at
Uniqueness: (rfq_item_id, key_norm) — prevents duplicate keys on the same item
Indexes: (rfq_item_id), (key_norm)
Data flow (create / read)
Create:
UI submits { title?, orderDetails, items[] }.
Mapper flattens orderDetails → rfqs columns, omits nulls (defaults apply).
Each item → rfq_items row.
Each item.specifications → rfq_item_specs rows.
Example “80 grams” → value=80, unit=grams.
Read:
Service selects rfqs with rfq_items + rfq_item_specs.
Each item’s specs are rebuilt into an object.
If value+unit → render “80 grams”.
UI remains unchanged.
Mapper (single source of truth)
rfqJsToDb(js):
Flattens title/description/category/subCategory/categoryId/quantity/orderType/ deliveryTime|deliveryTimeline/customDate/delivery/incoterms/payment|paymentTerms/ warranty/installation.
Sanitizers: "" → NULL, parse dates/numbers, prune null/undefined.
rfqDbToJs(db):
Returns full RFQ; also adds orderDetails for convenience.
Why normalize specs
Searchable: query key/value directly.
Constraints: uniqueness per (item, key_norm).
Updates: edit one spec without touching others.
Offline: same object shape in IndexedDB.
UI contract (unchanged feel)
Items still expose item.specifications as an object.
Add custom attribute → normalize key, keep label, store value + optional unit.
MiniCart/Review render spec chips same as before.
Defaults & safety
Mapper omits NULLs where defaults exist (posted_time, status, quotations, views, company).
Empty strings → NULL.
DB fills defaults safely.
RLS + triggers continue to apply.
Required vs optional (recommended UI rules)
Header (required): title (≥2 chars), order_type, category (id or string)
Header (optional): quantity summary, delivery_time, incoterms, payment, warranty, installation
Per item (required): product_name, quantity
Per item (optional): specs (with unit if numeric)
Nice to have (future)
rfq_specs table (RFQ-level specs).
spec_templates(category_prefix, key_norm, key_label) for suggested attributes.
Offline IndexedDB sync.
Category-driven spec templates.
Migration note (one-off)
Legacy RFQs with embedded specs (JSON) → backfill into rfq_item_specs.
One row per key/value.
Normalize key, split unit if present.
Example (easy to visualize)
RFQ “A4 Paper”
rfqs:
title='A4 Paper Bulk', order_type='one-time', delivery_time='standard',
incoterms='EXW', payment='net-30'
rfq_items:
product_name='A4 Copy Paper', quantity=100, purchase_type='one-time'
product_name='A4 Recycled Paper', quantity=150, purchase_type='one-time'
rfq_item_specs:
(item #1) key_norm='gsm', value='80', unit='g/m²'
(item #1) key_norm='color', value='white'
(item #2) key_norm='material', value='recycled'
Trade-offs (intentional)
More rows/joins vs JSON → more complex writes.
But: queries, constraints, updates are safer.
Header vs item kept separate (no auto-copy).
Testing checklist
Create RFQ: header saved, defaults applied.
Items saved in rfq_items.
Specs saved in rfq_item_specs, unique per item.
Update: omit null → keeps old value.
Specs: add/update/delete all work.
“Done” checklist
RFQ header normalized, defaults apply.
Items stored in rfq_items.
Specs normalized in rfq_item_specs.
UI reads item.specifications as object.
Unique (rfq_item_id, key_norm) enforced.
Add/update/remove spec helpers consistent.
Legacy/demo data backfilled or validated.
RPC & service layer (atomic upserts)
We don’t let the UI write 3 tables separately. We use a Postgres RPC: rfq_upsert_items_and_specs to:
Insert/update items under a given RFQ.
Insert/update specs under each item.
Enforce that each item truly belongs to that RFQ (no cross-RFQ updates).
Client-side service (rfqService.js):
createRFQ(rfq):
Insert RFQ header in public.rfqs.
Call RPC with sanitized items (no id/rfqId for brand-new RFQs).
If RPC fails → delete the newly inserted header (prevents orphan RFQs).
updateRFQ(id, updates):
Patch header (exclude items).
Call RPC with sanitized items.
Include id only if that item already belongs to id (safety).
Benefit: prevents “item does not belong to rfq” (FK 23503) and avoids orphan rows.
Sanitization rules (service)
Create: strip all id and rfqId from items.
Update: include id only if (item.rfqId === rfq.id) (or item.rfq_id === rfq.id).
Common fields sent to RPC: product_name, category_path, quantity, purchase_type, barcode, specifications.
Defaults: quantity=1 if missing, purchase_type='one-time' if missing.
Orphans cleanup
Before we added a compensating delete, failed RPC calls could leave RFQ headers without items.
Now createRFQ deletes the header if the RPC fails.
Optional one-time cleanup for old tests:
DELETE FROM public.rfqs r
WHERE NOT EXISTS (SELECT 1 FROM public.rfq_items i WHERE i.rfq_id = r.id)
  AND r.created_at >= now() - interval '14 days';
Views (simplified reads)
We use two helper views for convenient reads:
public.v_rfq_with_items_and_specs
Denormalized RFQ header with embedded items/specs summary.
Columns include: id, public_id, company, title, …, user_id, created_at, …, items_with_specs.
public.v_rfq_item_specs_agg
Aggregates specs per item into one row.
Columns: rfq_id, rfq_item_id, specifications.
UI impact: frontend can read views instead of hand-joining 3 tables.
Security: views now security invoker (+ grants)
We flipped both views to security_invoker=on so they execute with the caller’s rights (RLS applies).
ALTER VIEW public.v_rfq_with_items_and_specs SET (security_invoker = on);
ALTER VIEW public.v_rfq_item_specs_agg       SET (security_invoker = on);
Tightened grants (principle of least privilege):
REVOKE ALL ON public.v_rfq_with_items_and_specs, public.v_rfq_item_specs_agg FROM PUBLIC;
GRANT  SELECT ON public.v_rfq_with_items_and_specs, public.v_rfq_item_specs_agg TO authenticated, service_role;
RLS quick test (how to validate with a simulated user)
-- pick a real user who owns RFQs
SELECT user_id, COUNT(*) FROM public.rfqs GROUP BY user_id ORDER BY 2 DESC LIMIT 5;

-- impersonate that user in this SQL session
SELECT set_config(
  'request.jwt.claims',
  json_build_object('role','authenticated','sub','THE-USER-UUID')::text,
  true
);
SELECT auth.uid();  -- should show THE-USER-UUID

-- base table should show their rows
SELECT COUNT(*) FROM public.rfqs WHERE user_id = auth.uid();

-- views respect RLS:
SELECT COUNT(*) FROM public.v_rfq_with_items_and_specs WHERE user_id = auth.uid();
SELECT COUNT(*) 
FROM public.v_rfq_item_specs_agg v
JOIN public.rfqs r ON r.id = v.rfq_id
WHERE r.user_id = auth.uid();
Future upgrade (nice to have)
Replace the 2-step create (insert header → RPC) with one transactional RPC (e.g., rfq_create_with_items_and_specs) that does both in a single DB transaction.
Benefit: zero chance of orphans even momentarily.
Cost: a bit more SQL to maintain, but cleaner.
Troubleshooting (fast)
Error 23503: item does not belong to rfq → you sent an item.id (or rfqId) that belongs to a different RFQ.
Fix: follow the sanitization rules in §15.
“Why did I see headers in DB when submit failed?” → header insert and RPC were separate; now we compensate by deleting the header if RPC fails (see §16).


****************************************************************



 */