
DB Rules — Categories, RFQs, Specs, Companies & Security (Updated)

This playbook explains how we store, secure, and work with categories, RFQs, items, specs, companies, and memberships so the app stays simple while the database enforces the rules.

It’s written in plain English for fast onboarding—copy the snippets, run the SQL, and use the service patterns as building blocks.

Follow it end-to-end to get clean queries, safe writes (RLS), and predictable behavior from UI → Worker → Supabase → DB.

⸻

Appendix A — SQL Trigger / Function Index (for copy–paste deploys)

This appendix is a map to the actual SQL objects in the database.
The canonical versions of these live in your Supabase migration files (or /supabase/sql/*), but they’re listed here so future maintainers know what exists and where to look.

A1) RFQ IDs & Seller IDs

1. rfq_set_seller_rfq_id() + trg_rfqs_set_seller_rfq_id
	•	Purpose: Auto-generate seller_rfq_id in the format SRF-XXXXXXXXXX on insert.
	•	Objects:
	•	function public.rfq_set_seller_rfq_id()
	•	trigger trg_rfqs_set_seller_rfq_id on public.rfqs
	•	Location:
	•	Supabase migration: supabase/migrations/<YYYYMMDDHHMMSS>_seller_rfq_id.sql (or similar)
	•	Behavior:
	•	If NEW.seller_rfq_id is null, generate a unique SRF-… value.
	•	Enforces uniqueness via rfqs_seller_rfq_id_uniq (and optional CHECK on format).

Result: RFQs now have two distinct identifiers:
	•	public_id → buyer-facing (e.g. RFQ-100091)
	•	seller_rfq_id → seller-facing (e.g. SRF-C4E104013E)

⸻

A2) RFQ Items & Specs (RPCs + Views)

2. rfq_upsert_items_and_specs(_rfq_id uuid, _items jsonb)
	•	Purpose: Atomic upsert of RFQ items + item specs for a given RFQ.
	•	Used by: createRFQ() and updateRFQ() in rfqService.
	•	Location:
	•	Supabase migration: supabase/migrations/<...>_rfq_items_specs_rpc.sql

3. Views: v_rfq_with_items_and_specs + v_rfq_item_specs_agg
	•	Purpose: Simplified reads of RFQs with embedded items/specs, RLS-safe via SECURITY INVOKER.
	•	Important flags:
	•	ALTER VIEW ... SET (security_invoker = on);
	•	Location:
	•	Supabase migration: supabase/migrations/<...>_rfq_views_items_specs.sql

⸻

A3) Categories & Taxonomy

4. Category import helpers
	•	category_upsert_path(p_path_text text, p_scheme text)
	•	category_import_from_staging_batch(p_scheme text, p_limit int)

Purpose:
	•	Build or update the category tree from staged breadcrumbs (UNSPSC, CUSTOM).

Location:
	•	Supabase migration: supabase/migrations/<...>_categories_taxonomy.sql

5. Category admin helpers
	•	category_set_active(category_id uuid, is_active boolean, reason text)
	•	categories_search(q text, in_scheme text default null, in_limit int default 25)

Purpose:
	•	Toggle visibility of category subtrees.
	•	Search active leaf categories by name/path.

⸻

A4) Category Suggestion & Audit

6. Suggestion tables & views

Tables:
	•	staging_rfq_category_candidates
	•	staging_product_category_candidates

Views:
	•	v_rfq_category_suggestions
	•	v_product_category_suggestions

Purpose:
	•	Store and review category suggestions for RFQs/Products.

Location:
	•	Supabase migration: supabase/migrations/<...>_category_suggestions.sql

7. Manual assignment functions
	•	set_rfq_category(rfq_id uuid, category_id uuid, reason text default 'manual')
	•	set_product_category(product_id uuid, category_id uuid, reason text default 'manual')

Purpose:
	•	Safely assign/override categories, with audit logging.

⸻

A5) Companies & Memberships

Note: These are new from Oct 2025. All writes go through the Cloudflare Worker with the service_role key.

8. Schema: companies, company_memberships, company_invites
	•	companies
	•	id uuid primary key
	•	name text not null
	•	created_at timestamptz default now()
	•	Unique index: ux_companies_lower_name on lower(name)
	•	company_memberships
	•	id uuid primary key
	•	company_id uuid not null references companies(id)
	•	user_id uuid not null references auth.users(id)
	•	track text not null ('procurement' | 'sales')
	•	role_level int not null (e.g. 30 = manager, 10 = member)
	•	created_at timestamptz default now()
	•	updated_at timestamptz default now()
	•	Unique index: company_memberships_company_id_user_id_key
	•	company_invites
	•	id uuid primary key
	•	company_id uuid not null references companies(id)
	•	email text not null
	•	invited_by uuid not null references auth.users(id)
	•	status text not null default 'pending'
	•	token uuid not null unique
	•	created_at timestamptz default now()
	•	accepted_at timestamptz null

Location:
	•	Supabase migration: supabase/migrations/<...>_companies_and_memberships.sql

⸻

A6) RLS Test Helpers

9. JWT simulation for RLS tests

Used in psql to simulate logged-in users:

SELECT set_config(
  'request.jwt.claims',
  json_build_object('role','authenticated','sub','<USER_UUID>')::text,
  true
);

SELECT auth.uid();  -- should echo <USER_UUID>

Useful for testing auth.uid()-based RLS policies.

⸻

A7) Audit & Event Logs

10. User role audit log
	•	Table: public.user_role_audit_log
	•	Purpose: Track every change to auth.users.raw_user_meta_data.roles (buyer/seller flips).
	•	Objects:
	•	function public.log_user_role_change()
	•	trigger trg_log_user_role_change on auth.users
	•	Behavior:
	•	After UPDATE on auth.users, if NEW.raw_user_meta_data-&gt;'roles' differs from OLD, insert a row with:
	•	user_id, email, old_roles, new_roles, changed_at.
	•	Security:
	•	RLS enabled; policy allows SELECT/INSERT/UPDATE/DELETE only for auth.role() = 'service_role'.
	•	Triggers run as SECURITY DEFINER and are not blocked by RLS.

11. Company membership audit log
	•	Table: public.company_membership_audit_log
	•	Purpose: Track changes to a user’s company membership and membership role.
	•	Objects:
	•	function public.log_company_membership_change()
	•	trigger trg_log_company_membership_change on public.company_memberships
	•	Behavior:
	•	After UPDATE on company_memberships, if company_id or role changes, insert a row with:
	•	user_id, old_company_id, new_company_id, old_role, new_role, changed_at.
	•	Security:
	•	RLS enabled; policy allows SELECT/INSERT/UPDATE/DELETE only for auth.role() = 'service_role'.

12. RFQ event log
	•	Table: public.rfq_event_log
	•	Purpose: Capture an immutable timeline of RFQ row changes (for debugging, audits, dispute support).
	•	Objects:
	•	function public.log_rfq_change()
	•	trigger trg_log_rfq_change on public.rfqs
	•	Behavior:
	•	After INSERT/UPDATE/DELETE on rfqs, insert a row with:
	•	rfq_id, action (TG_OP), old_row (jsonb), new_row (jsonb), changed_at.
	•	Security:
	•	RLS enabled; policy allows SELECT/INSERT/UPDATE/DELETE only for auth.role() = 'service_role'.

13. Quotation event log
	•	Table: public.quotation_event_log
	•	Purpose: Capture an immutable timeline of quotation row changes (submitted/updated/accepted/etc).
	•	Objects:
	•	function public.log_quotation_change()
	•	trigger trg_log_quotation_change on public.quotations
	•	Behavior:
	•	After INSERT/UPDATE/DELETE on quotations, insert a row with:
	•	quotation_id, action (TG_OP), old_row (jsonb), new_row (jsonb), changed_at.
	•	Security:
	•	RLS enabled; policy allows SELECT/INSERT/UPDATE/DELETE only for auth.role() = 'service_role'.


A8) Quotations & Items — Tables & Views

14. Quotations core tables

	•	quotations
		•	Identity & links:
			•	id uuid primary key
			•	rfq_id uuid references public.rfqs(id)
			•	seller_id uuid references auth.users(id)
			•	seller_company_id uuid references public.companies(id)
			•	created_by_membership_id uuid references public.company_memberships(id)
		•	Commercials:
			•	currency text default 'AED'
			•	total_price numeric not null
			•	delivery_timeline_days integer
			•	validity_days integer
			•	payment_terms text
			•	shipping_terms text
			•	notes text
			•	internal_reference text (seller’s internal code, optional)
			•	seller_company text (denormalized name for display)
		•	Status & timeline:
			•	status text default 'draft'  -- e.g. 'draft', 'submitted', 'accepted', 'rejected', 'withdrawn', 'expired'
			•	submitted_at timestamptz
			•	expires_at timestamptz
			•	created_at timestamptz default now()
			•	updated_at timestamptz default now()
		•	Indexes:
			•	quotations_pkey on (id)
			•	idx_quotations_rfq_id on (rfq_id)
			•	idx_quotations_seller_id / quotations_seller_id_idx on (seller_id)
			•	idx_quotes_seller_company on (seller_company_id)
			•	idx_quotes_created_by_membership on (created_by_membership_id)
			•	quotations_status_idx on (status)
			•	quotations_rfq_updated_idx on (rfq_id, updated_at desc)
		•	Lifecycle (current behavior):
			•	status is a plain text field with no DB-enforced state machine.
			•	No trigger currently auto-closes RFQs when a quotation is accepted.
			•	No trigger currently auto-expires quotations when expires_at passes.
			•	These transitions are driven by the app/service layer (or are not yet implemented).

	•	quotation_items
		•	Links:
			•	id uuid primary key
			•	quotation_id uuid not null references public.quotations(id)
			•	rfq_item_id uuid references public.rfq_items(id)
		•	Commercials per item:
			•	unit_price numeric not null
			•	unit text not null
			•	qty_offer numeric not null
			•	discount_type text
			•	discount_value numeric default 0
			•	warranty_months integer default 0
			•	created_at timestamptz default now()
			•	updated_at timestamptz default now()
		•	Usage:
			•	One row per RFQ item quoted.
			•	Used to reconstruct line items in the buyer/seller quotation views.

	•	quotation_item_specs
		•	Links:
			•	id uuid primary key
			•	quotation_id uuid not null references public.quotations(id)
			•	rfq_item_id uuid references public.rfq_items(id)
			•	rfq_spec_id uuid references public.rfq_item_specs(id)
		•	Spec fields:
			•	key_norm text not null
			•	key_label text not null
			•	value text not null
			•	unit text null
			•	source text not null (enum-type: buyer/seller/etc.)
			•	decision text not null (enum-type: included/excluded/custom/etc.)
			•	sort_order integer
		•	Audit:
			•	created_at timestamptz default now()
			•	updated_at timestamptz default now()
			•	created_by uuid
			•	unique_key text (optional safety belt for idempotency)

15. Quotation spec views

	•	public.v_quotation_item_specs_included
		•	Projection:
			•	quotation_id, rfq_item_id, key_norm, key_label, value, unit, source
		•	Purpose:
			•	Read-only view of “included” quotation specs, used when showing confirmed or included specs to buyers/sellers.
			•	SECURITY INVOKER; inherits RLS from underlying tables.

	•	public.v_quotation_item_specs_seller
		•	Projection:
			•	quotation_id, rfq_item_id, rfq_spec_id, key_norm, key_label, value, unit, source, decision
		•	Purpose:
			•	Seller-side view of specs, including decision flags (e.g. included/excluded/alternative).
			•	SECURITY INVOKER; inherits RLS from underlying tables.

⸻

Part 1 — Products & Categories (Taxonomy)

We maintain two taxonomies in one table (public.categories):
	•	CUSTOM (our own)
	•	UNSPSC (imported from UNGM)

DB derives breadcrumbs (path_text) and depth automatically.
The app never writes derived fields.

Key columns:
	•	id uuid (PK)
	•	name text
	•	parent_id uuid
	•	scheme text ('CUSTOM' | 'UNSPSC')
	•	path_text text
	•	depth int

Triggers maintain depth / path_text, prevent loops, and propagate changes.

Uniqueness (scheme-aware):
	•	Unique roots per scheme
	•	Unique sibling names per scheme
	•	Unique full path per scheme

Indexes:

-- Unique root per scheme
categories_root_uni (scheme, lower(btrim(name)))
  WHERE parent_id IS NULL;

-- Unique sibling per scheme
categories_sibling_uni (scheme, parent_id, lower(btrim(name)))
  WHERE parent_id IS NOT NULL;

-- Unique breadcrumb per scheme
categories_path_uni (scheme, lower(btrim(path_text)));

UNSPSC Import Steps
	1.	Stage raw nodes → staging_unspsc_nodes
	2.	Build staged breadcrumbs → staging_category_paths
	3.	Import via:
	•	category_upsert_path(p_path_text, p_scheme)
	•	category_import_from_staging_batch(p_scheme, p_limit)
	4.	Run sanity checks (depth, name matches, orphans)
	5.	Use views for searching (categories_leaves_active, v_rfqs_with_category)

⸻

Categories – Operational Rules (Plain English)
	1.	Data we keep (categories table)
Columns:
	•	id (uuid), parent_id (uuid | null), name (text)
	•	path_text (derived), depth (derived; root = 0), status ('active'|'deprecated')
Meanings:
	•	parent_id: parent node (root has NULL)
	•	path_text: breadcrumb like Electronics > Accessories > Cables
	•	depth: levels from root (root = 0)
	2.	Business tables
We store only category_id in business tables; no free-text category:
	•	products.category_id → categories.id
	•	rfqs.category_id → categories.id
	3.	Single source of truth (DB owns the tree)
App never writes path_text or depth.
On insert/update (name / parent_id) the DB derives:
	•	path_text from parent.path_text + ’ > ’ + name
	•	depth = parent.depth + 1 (or 0 for root)
DB:
	•	Blocks cycles (can’t parent a node under its own subtree).
	•	Updates the whole subtree after a rename/move so breadcrumbs stay correct.
	4.	Uniqueness rules
	•	At root: no two roots in the same scheme with the same normalized name.
	•	Among siblings: no two children under the same parent in the same scheme with the same normalized name.
	•	Safety belt: breadcrumb (path_text) is unique (normalized).
→ Allows “Accessories” under multiple different parents/schemes, but not duplicated under the same parent/scheme.
	5.	Who can edit
	•	Users: read the tree, select a leaf only.
	•	Admins: add/move/rename/deprecate categories via an admin screen.
	•	RLS: reads available (via views), writes admin-only (via service role / Worker).
	6.	Search & pick
	•	User types “cables”.
	•	API searches by name and breadcrumb (indexed).
	•	Results shown as breadcrumbs (e.g., Electronics > Accessories > Cables).
	•	User can select only leaves (no children).
	•	Server re-checks (exists, active, leaf) and stores category_id.
	7.	Zero-result handling
Use pending_category_requests:
	•	id, user_id, text_entered, normalized_text, status('open'|'closed'), created_at, resolved_category_id
Protections:
	•	De-dupe open requests by normalized text.
	•	Rate-limit per user.
	8.	Admin workflow
	•	Admins review open requests, assign or create new leaves, then close them.
	•	Prefer deprecated (with optional redirect) over delete.
	9.	DB guarantees
	•	Derives path_text & depth (root=0)
	•	Prevents cycles & duplicates
	•	Propagates breadcrumb/level updates
	•	Validates leaf-only assignment
	•	Enforces RLS: admin-only writes
	10.	Indexes

	•	(parent_id)
	•	(normalized name)
	•	(normalized path_text)

⸻

Part 2 — Security: RLS & Security Invoker Views

Goal:
Keep Supabase views safe — RLS applies everywhere by default. Any exceptions are explicitly handled by the Worker using the service role.

Key Fixes (Oct 2025)
	•	Converted several views from SECURITY DEFINER → SECURITY INVOKER where appropriate.
	•	Enabled RLS on staging/audit tables and restricted them.
	•	Granted access only to authenticated and service_role as needed.
	•	Removed all PUBLIC/anon privileges.
	•	Functions that must bypass RLS (e.g. some admin helpers) remain SECURITY DEFINER but are callable only via the service key.

Validation Checklist
	•	Normal users can’t access staging/audit tables directly.
	•	Views show only their own rows where applicable.
	•	Linter is clean (no security_definer_view warnings for user-facing views).
	•	Worker endpoints that use the service_role key are the only path for admin-like operations.

⸻

Part 3 — RFQs, Items & Specifications (Normalized + Mapper)

0) Overview

RFQs are split into three layers:
	•	Header (rfqs)
	•	Items (rfq_items)
	•	Specifications (rfq_item_specs)

The UI still sends/receives item.specifications as an object — the DB stores normalized rows.

⸻

1) Tables

rfqs (simplified core fields)
	•	Identity & ownership:
	•	id uuid (PK)
	•	public_id text (buyer-facing, e.g. RFQ-100091)
	•	seller_rfq_id text (seller-facing, e.g. SRF-XXXXXXXXXX)
	•	user_id uuid (the user who created the RFQ)
	•	buyer_company_id uuid (the company on whose behalf the RFQ is posted, required)
	•	Status & metrics:
	•	status text (e.g. 'active', 'closed')
	•	posted_time timestamptz default now()
	•	quotations int default 0
	•	views int default 0
	•	Commercial terms:
	•	incoterms text
	•	payment text
	•	delivery_time text
	•	plus other description/order fields as needed

rfq_items
	•	One row per item:
	•	id uuid (PK)
	•	rfq_id uuid references rfqs(id)
	•	product_name text
	•	barcode text
	•	quantity numeric
	•	purchase_type text (e.g. 'one-time', 'recurring')
	•	category_path text (derived convenience; may be nullable)
	•	created_at, updated_at
	•	Index: (rfq_id)

rfq_item_specs
	•	One row per attribute:
	•	id uuid
	•	rfq_item_id uuid references rfq_items(id)
	•	key_norm text (normalized key, e.g. 'weight', 'size')
	•	key_label text (display label, e.g. 'Weight', 'Size')
	•	value text (e.g. '80 grams', 'm')
	•	unit text (optional; may be null)
	•	Unique: (rfq_item_id, key_norm)
	•	Indexes: (rfq_item_id), (key_norm)

⸻

2) Data Flow

Create RFQ:
	•	Mapper flattens RFQ header + items.
	•	Insert into rfqs with:
	•	user_id = auth.uid()
	•	buyer_company_id from the authenticated user’s active membership.
	•	Call rfq_upsert_items_and_specs(_rfq_id, _items) to insert items + specs.

Each spec (key/value/unit) → inserted into rfq_item_specs.
Example: “Size: m” → key_norm='size', value='m', unit=null.

Read RFQ (buyer-facing):
	•	Service joins rfqs → rfq_items → rfq_item_specs or uses v_rfq_with_items_and_specs.
	•	Each item’s buyerSpecifications reconstructed from specs rows.

Read RFQ (seller-facing hydrate):
	•	Frontend calls Worker /seller/rfq/hydrate?id=<rfq_id>&sellerId=<seller_company_id>.
	•	Worker:
	1.	Validates JWT (requireUser).
	2.	Confirms seller company via company_memberships.
	3.	Confirms RFQ is active and buyer_company_id ≠ seller_company_id.
	4.	Calls public.rfq_hydrate_seller(_rfq_id uuid, _seller_id uuid) using the service key.
	5.	Returns hydrated JSON with header + items + specs in seller-safe form.

If same-company or unauthorized → Worker returns null (or a structured error) without leaking RFQ data.

⸻

3) Mapper

Two core mappers:
	•	rfqJsToDb → flattens UI-shaped RFQ into DB rows (header, items, specs).
	•	rfqDbToJs → hydrates DB rows back into UI shape with nested items/specs.

This keeps the UI stable while the DB stays normalized.

⸻

4) Why normalize specs
	•	Queryable & indexed (e.g., filter by weight/size).
	•	Enforces uniqueness per item.
	•	Simple to edit a single spec without rewriting a blob.
	•	Offline sync becomes consistent (per-row instead of big JSON fields).

⸻

5) UI Contract
	•	UI still works with rfq.items[i].buyerSpecifications as an array/object.
	•	MiniCart and Review steps reuse the same chips.
	•	Seller quotation UIs consume hydrated RFQ from the Worker (not directly from Supabase).

⸻

6) Safety & RLS
	•	Defaults handled by DB (e.g., posted_time, status, counters).
	•	Empty strings pruned in service layer before writes.
	•	Owners (buyers) operate on rfqs via RLS (user_id = auth.uid() for CRUD).
	•	Sellers never query PostgREST directly for RFQs; they go through the Worker.
	•	Views used by the app are SECURITY INVOKER and RLS-protected for buyer-facing operations.

⸻

7) RPC & Service Layer

rfq_upsert_items_and_specs(_rfq_id uuid, _items jsonb):
	•	Inserts/updates items and specs atomically for the RFQ.
	•	Enforces the correct rfq_id.
	•	Cleans empty values.
	•	Called from createRFQ() and updateRFQ().

Buyer flow:
	•	createRFQ() → inserts header (with user_id and buyer_company_id) then calls RPC.
	•	If RPC fails → deletes orphan header.
	•	updateRFQ() → patches header and items via the same RPC.

⸻

8) Views

Key views:
	•	public.v_rfq_with_items_and_specs
	•	public.v_rfq_item_specs_agg

Both:
	•	Are SECURITY INVOKER.
	•	Have RLS enforced through underlying tables.
	•	Grant SELECT to authenticated and service_role only.
	•	Used primarily for buyer-facing RFQ reads.

⸻

9) Testing RLS (Buyer side)

SELECT set_config(
  'request.jwt.claims',
  json_build_object('role','authenticated','sub','USER_UUID')::text,
  true
);
SELECT auth.uid();

SELECT COUNT(*) FROM public.rfqs WHERE user_id = auth.uid();
SELECT COUNT(*) FROM public.v_rfq_with_items_and_specs WHERE user_id = auth.uid();

You should see matching counts for RFQs owned by that user.

⸻

10) Migration & Cleanup

Legacy RFQs that kept specs as JSON are backfilled into rfq_item_specs:
	•	Parse specs JSON into (rfq_item_id, key_norm, key_label, value, unit) rows.
	•	Clean up orphan RFQs:

DELETE FROM public.rfqs r
WHERE NOT EXISTS (
  SELECT 1 FROM public.rfq_items i WHERE i.rfq_id = r.id
)
  AND r.created_at >= now() - interval '14 days';


⸻

Part 4 — Supabase Security Hardening (Oct 2025)

0) Summary
	•	Views switched to SECURITY INVOKER where app-facing.
	•	RLS enabled everywhere that touches user data.
	•	Grants tightened (no PUBLIC, no anon except where explicitly intended).
	•	Service-role–only paths are routed through the Cloudflare Worker.
	•	Append-only audit/event tables added (user_role_audit_log, company_membership_audit_log, rfq_event_log, quotation_event_log) with RLS enabled and service_role-only access.

1) Views

Examples:
	•	v_rfqs_admin → SELECT for service_role only.
	•	v_rfqs_card → SELECT for authenticated + service_role.
	•	Other app-facing views → SECURITY INVOKER + RLS.

Note:
	•	v_rfqs_card is currently defined as SECURITY DEFINER and is still flagged by the Supabase linter. It continues to work as-is for RFQ cards, and is scheduled for a future hardening pass to align with the SECURITY INVOKER + RLS pattern.

2) Key RLS policies (high-level)
	•	rfqs:
	•	Buyers: CRUD restricted to user_id = auth.uid().
	•	Sellers: do not SELECT directly; they must go via the Worker. Any legacy policies that allowed sellers to select are now treated as implementation details behind Worker-auth, not a public contract.
	•	rfq_items:
	•	Visibility derived from rfqs via FK and RLS.
	•	rfq_item_specs:
	•	Inherits visibility via rfq_items.
	•	quotations:
	•	Sellers: full CUD (INSERT/UPDATE/DELETE) restricted to seller_id = auth.uid() via quotations_cud_owner.
	•	Buyers: SELECT via quotations_select_parties, which allows access when rfqs.user_id = auth.uid() (buyer sees only quotations for RFQs they own).
	•	Inserts: guarded by quotations_insert_not_same_company to ensure rfqs.buyer_company_id IS DISTINCT FROM quotations.seller_company_id (no self-quoting).
	•	quotation_items:
	•	Sellers: SELECT/INSERT/UPDATE/DELETE allowed only when the parent quotation.seller_id = auth.uid() via qi_seller_* policies.
	•	Buyers: SELECT allowed via qi_buyer_select, which checks that the parent RFQ is owned by auth.uid() through rfqs.user_id.
	•	quotation_item_specs:
	•	Exposed via SECURITY INVOKER views (v_quotation_item_specs_included, v_quotation_item_specs_seller) that inherit RLS from quotations/quotation_items and the RFQ ownership rules.
	•	companies, company_memberships, company_invites:
	•	Writes restricted to service_role via Worker endpoints.
	•	SELECT for end-users is either minimal or proxied through Worker, depending on feature needs.

3) Validation
	•	service_role can see and manipulate everything as needed (through Worker only).
	•	authenticated users see only their own data or filtered views.
	•	anon is blocked from sensitive tables.
	•	Verified using auth.uid() and set_config('request.jwt.claims', ...).

⸻

Part 5 — Updates: Seller IDs & Seller RFQ Hydration

Seller-facing RFQ IDs
	•	seller_public_id has been dropped.
	•	seller_rfq_id text not null unique added, auto-generated by:

trigger trg_rfqs_set_seller_rfq_id
→ function rfq_set_seller_rfq_id()


	•	Format: typically SRF-XXXXXXXXXX.
	•	Constraint: rfqs_seller_rfq_id_uniq ensures uniqueness.
	•	Optional CHECK enforces a pattern like ^SRF-[0-9A-F]{10}$.

All seller-facing UI uses seller_rfq_id for display.

⸻

Seller Hydrate RPC: rfq_hydrate_seller(_rfq_id uuid, _seller_id uuid)
	•	Location: public.rfq_hydrate_seller (SQL function).
	•	Shape: returns a JSONB document:

{
  "id": "...",
  "publicId": "RFQ-100088",
  "seller_rfq_id": "SRF-C4E104013E",
  "title": "test penCorD",
  "status": "active",
  "createdAt": "...",
  "postedTime": "...",
  "qtyTotal": 20,
  "categoryPathLast": "...optional...",
  "orderDetails": {
    "incoterms": "-",
    "payment": "net-30",
    "deliveryTime": "standard"
  },
  "items": [
    {
      "id": "...",
      "productName": "test penCorD",
      "categoryPath": "Office Supplies → Paper → A4",
      "barcode": null,
      "quantity": 1,
      "purchaseType": "one-time",
      "buyerSpecifications": [
        {
          "id": "...",
          "key_norm": "size",
          "key_label": "Size",
          "value": "m",
          "unit": null
        }
      ]
    }
  ]
}


	•	Security mode:
	•	The function itself is SECURITY DEFINER, owned by postgres.
	•	All PUBLIC privileges revoked.
	•	It is callable only via the service key (i.e., via the Worker/PostgREST with service_role).
	•	Caller contract (Worker-side):
The Worker must pre-check:
	•	RFQ exists.
	•	RFQ status = 'active'.
	•	rfqs.buyer_company_id != seller_company_id.
If any check fails → do not call rfq_hydrate_seller and return null or an error instead.

This guarantees that even though the function is SECURITY DEFINER, company isolation is enforced in the Worker before any seller data is hydrated.

⸻

Part 6 — Companies, Memberships & Invites (Oct 2025)

0) What we’re building (plain English)

We added companies and company memberships so a user can belong to a company, and companies can invite additional users (e.g. sales teammates).

Currently:
	•	RFQs are owned by user_id and tagged with buyer_company_id.
	•	Company is used for:
	•	Gating the UI (buyers/sellers must belong to a company to use the app).
	•	Preventing a seller from seeing RFQs from their own company (company isolation).
	•	Inviting additional users into a company.
	•	All company + membership writes go through the Cloudflare Worker using the Supabase service key (RLS-safe; no client-side service key).

⸻

1) Tables

A) public.companies
Columns (simplified):
	•	id uuid primary key
	•	name text not null
	•	created_at timestamptz default now()

Uniqueness:
	•	ux_companies_lower_name — unique on lower(name)
	•	Prevents duplicate company names ignoring case/spaces
	•	Example: "Acme Demo" vs "acme demo" → rejected with 23505.

Usage:
	•	Created only via Worker endpoint /company/create (service key).
	•	Not directly writable from the frontend.

⸻

B) public.company_memberships
Each row connects a user to a company, with a track and a role level.

Columns (current shape):
	•	id uuid primary key
	•	company_id uuid not null references public.companies(id)
	•	user_id uuid not null references auth.users(id)
	•	track text not null
	•	'procurement' → buyer-side roles
	•	'sales' → seller-side roles
	•	role_level int not null
	•	30 = “manager” (e.g. procurement manager)
	•	10 = basic member
	•	created_at timestamptz default now()
	•	updated_at timestamptz default now()

Constraints:
	•	company_memberships_company_id_user_id_key — unique (company_id, user_id)

Usage:
	•	When a user creates a company:
	•	Insert membership with:
	•	track = 'procurement'
	•	role_level = 30 (manager)
	•	When a user accepts a company invite:
	•	Insert membership with:
	•	track = 'sales'
	•	role_level = 10
	•	Worker helper getCompanyIdForUser(env, userId) queries this table (with the service key) and attaches user.company_id to the authenticated user object for downstream logic (e.g. seller RFQ filtering).

Note: Currently we pick the first membership row; if a user ever has multiple companies, we’ll need a “primary” flag or a way to choose the active membership.

⸻

C) public.company_invites
Invites allow an existing company member to bring another user into their company by email.

Columns:
	•	id uuid primary key
	•	company_id uuid not null references public.companies(id)
	•	email text not null
	•	invited_by uuid not null references auth.users(id) (who sent the invite)
	•	status text not null default 'pending'
	•	'pending' | 'accepted' | 'cancelled' | 'expired' (currently using pending/accepted)
	•	token uuid not null unique (invite token)
	•	created_at timestamptz default now()
	•	accepted_at timestamptz null

Usage:
	•	Created only via Worker /company/invite using the service key.
	•	Accepted via Worker /company/accept using the invite token + user’s JWT.

⸻

2) Worker Endpoints (how the app talks to these tables)

All endpoints live in the Cloudflare Worker, not directly in the React app.

/company/create (POST)
	•	Auth: requires a valid Supabase JWT (requireUser).
	•	Input (JSON):

{ "name": "Acme Demo" }


	•	Flow:
	1.	Validate name is non-empty.
	2.	Insert into public.companies with the service key.
	3.	Insert a company_memberships row for the caller:
	•	track = 'procurement'
	•	role_level = 30
	4.	Return { companyId, name, membershipId }.
	•	DB guarantees:
If name clashes case-insensitively, Postgres raises 23505 (ux_companies_lower_name) → Worker returns a 4xx/5xx with that signal.

⸻

/company/invite (POST)
	•	Auth: requires Supabase JWT + an existing membership (so user.company_id is present).
	•	Input (JSON):

{ "email": "someone@example.com" }


	•	Flow:
	1.	Validate email is non-empty.
	2.	Generate token = uuid.
	3.	Insert into public.company_invites with:
	•	company_id = user.company_id (from membership lookup)
	•	email
	•	invited_by = user.id
	•	status = 'pending'
	•	token
	4.	Return { ok: true, invite: { ... } }.

⸻

/company/accept (POST)
	•	Auth: requires Supabase JWT for the invitee.
	•	Input (JSON):

{ "token": "<invite-token-uuid>" }


	•	Flow:
	1.	Validate token.
	2.	Lookup invite:
	•	company_invites?token=eq.<token>&status=eq.pending (service key).
	•	If none → { error: "invalid_or_expired" } with 404.
	3.	Create membership:
	•	Insert into company_memberships:
	•	company_id = invite.company_id
	•	user_id = auth.user.id
	•	track = 'sales'
	•	role_level = 10
	•	If the unique constraint (company_id, user_id) fires (23505), treat as “already a member” and fetch existing membership instead of crashing.
	4.	Mark invite as accepted:
	•	status = 'accepted'
	•	accepted_at = now()
	5.	Return:

{ "ok": true, "company_id": "...", "membership_id": "..." }


	•	Behavior:
Endpoint is effectively idempotent for an invitee:
	•	First call creates membership.
	•	Later calls with same token/user see duplicate key but resolve to existing membership and still mark invite accepted.

⸻

3) RLS & Access Rules (high-level)

We keep the same “server-only writes” pattern:
	•	Read paths:
	•	Most company reads (like getCompanyIdForUser) are done from the Worker using the service key, so company tables can have very strict RLS or even service-only SELECT.
	•	If we later expose “My company” directly to the UI, we can:
	•	Add invoker views with user-aware filters, or
	•	Keep reads via Worker and expose minimal APIs.
	•	Write paths:
	•	Only the service role writes:
	•	INSERT / UPDATE on companies
	•	INSERT / UPDATE on company_memberships
	•	INSERT / UPDATE on company_invites
	•	The React app never sees the service key.
	•	RFQs & company isolation:
	•	rfqs include buyer_company_id (required).
	•	When a seller browses RFQs via /seller/rfqs, the Worker applies:

status = 'active'
AND buyer_company_id != seller_company_id


	•	When a seller hydrates a specific RFQ via /seller/rfq/hydrate, the Worker enforces the same check before calling rfq_hydrate_seller.
	•	Sellers never query rfqs directly from the frontend; visibility is always mediated by the Worker.

⸻

4) UI Contract (for later readers)
	•	Frontend never talks to Supabase directly for company operations.
	•	Frontend uses Worker client services:
	•	createCompany(name) → calls Worker /company/create
	•	inviteCompanyUser(email) → calls Worker /company/invite
	•	acceptCompanyInvite(token) → calls Worker /company/accept
	•	Auth:
	•	Auth still uses Supabase JWT for login.
	•	Worker requireUser validates the JWT and resolves user.company_id by looking up company_memberships with the service key (we do not rely solely on stale JWT app_metadata).
	•	RFQs:
	•	Still keyed by user_id (owner).
	•	Additionally keyed by buyer_company_id (required) for company-level visibility.
	•	Buyers see their own RFQs via direct Supabase (with RLS).
	•	Sellers can only see RFQs from other companies, and only via the Worker.

⸻

✅ Final Status (Post–Fix, Nov 2025)
	•	Categories stable & searchable.
	•	RFQs normalized (header/items/specs).
	•	Companies & memberships wired through Worker-only writes.
	•	buyer_company_id enforced and used for seller visibility.
	•	seller_rfq_id fully migrated and used in seller UI.
	•	Seller RFQ list + hydrate now enforce:

status = 'active'
AND buyer_company_id != seller_company_id


	•	Views hardened (SECURITY INVOKER where app-facing).
	•	RLS tightened; service operations go via Worker + service key.
