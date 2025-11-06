/Users/hamzanazzal/Desktop/fecro.ae/DB rules (updated).md


This playbook explains how we store, secure, and work with categories, RFQs, items, and specs so the app stays simple while the database enforces the rules.
It’s written in plain English for fast onboarding—copy the snippets, run the SQL, and use the service patterns as building blocks.
Follow it end-to-end to get clean queries, safe writes (RLS), and predictable behavior from UI to DB.

****************
---

## Appendix A — SQL Trigger / Function Index (for copy–paste deploys)

This appendix is a **map** to the actual SQL objects in the database.  
The *canonical* versions of these live in your Supabase migration files (or `/supabase/sql/*`), but they’re listed here so future maintainers know **what exists** and **where to look**.

### A1) RFQ IDs & Seller IDs

**1. `rfq_set_seller_rfq_id()` + `trg_rfqs_set_seller_rfq_id`**  
- **Purpose:** Auto-generate `seller_rfq_id` in the format `SRF-XXXXXXXXXX` on insert.  
- **Objects:**
  - `function public.rfq_set_seller_rfq_id()`  
  - `trigger trg_rfqs_set_seller_rfq_id on public.rfqs`  
- **Location:**  
  - _Supabase migration_: `supabase/migrations/<YYYYMMDDHHMMSS>_seller_rfq_id.sql` (or similar)  
- **Behavior:**  
  - If `NEW.seller_rfq_id` is null, generate a unique `SRF-…` value.  
  - Enforces uniqueness via `rfqs_seller_rfq_id_uniq`.

---

### A2) RFQ Items & Specs (RPCs + Views)

**2. `rfq_upsert_items_and_specs(_rfq_id uuid, _items jsonb)`**  
- **Purpose:** Atomic upsert of RFQ items + item specs for a given RFQ.  
- **Used by:** `createRFQ()` and `updateRFQ()` in `rfqService`.  
- **Location:**  
  - _Supabase migration_: `supabase/migrations/<...>_rfq_items_specs_rpc.sql`  

**3. Views: `v_rfq_with_items_and_specs` + `v_rfq_item_specs_agg`**  
- **Purpose:** Simplified reads of RFQs with embedded items/specs, RLS-safe.  
- **Important flags:**  
  - `ALTER VIEW ... SET (security_invoker = on);`  
- **Location:**  
  - _Supabase migration_: `supabase/migrations/<...>_rfq_views_items_specs.sql`  

---

### A3) Categories & Taxonomy

**4. Category import helpers**  
- `category_upsert_path(p_path_text text, p_scheme text)`  
- `category_import_from_staging_batch(p_scheme text, p_limit int)`  

**Purpose:**  
- Build or update the category tree from staged breadcrumbs (UNSPSC, CUSTOM).

**Location:**  
- _Supabase migration_: `supabase/migrations/<...>_categories_taxonomy.sql`  

**5. Category admin helpers**  
- `category_set_active(category_id uuid, is_active boolean, reason text)`  
- `categories_search(q text, in_scheme text default null, in_limit int default 25)`  

**Purpose:**  
- Toggle visibility of category subtrees.  
- Search active leaf categories by name/path.

---

### A4) Category Suggestion & Audit

**6. Suggestion tables & views**  
- Tables:  
  - `staging_rfq_category_candidates`  
  - `staging_product_category_candidates`  
- Views:  
  - `v_rfq_category_suggestions`  
  - `v_product_category_suggestions`  

**Purpose:**  
- Store and review category suggestions for RFQs/Products.

**Location:**  
- _Supabase migration_: `supabase/migrations/<...>_category_suggestions.sql`  

**7. Manual assignment functions**  
- `set_rfq_category(rfq_id uuid, category_id uuid, reason text default 'manual')`  
- `set_product_category(product_id uuid, category_id uuid, reason text default 'manual')`  

**Purpose:**  
- Safely assign/override categories, with audit logging.

---

### A5) Companies & Memberships

> **Note:** These are new from Oct 2025. All writes go through the Cloudflare Worker with the `service_role` key.

**8. Schema: `companies`, `company_memberships`, `company_invites`**  

- **companies**  
  - `id uuid primary key`  
  - `name text not null`  
  - Unique index: `ux_companies_lower_name` on `lower(name)`  

- **company_memberships**  
  - `id uuid primary key`  
  - `company_id uuid not null references companies(id)`  
  - `user_id uuid not null references auth.users(id)`  
  - `track text not null` (`'procurement' | 'sales'`)  
  - `role_level int not null` (e.g. 30 = manager, 10 = member)  
  - Unique index: `company_memberships_company_id_user_id_key`  

- **company_invites**  
  - `id uuid primary key`  
  - `company_id uuid not null`  
  - `email text not null`  
  - `invited_by uuid not null`  
  - `status text not null default 'pending'`  
  - `token uuid not null unique`  
  - `accepted_at timestamptz null`  

**Location:**  
- _Supabase migration_: `supabase/migrations/<...>_companies_and_memberships.sql`  

**9. RLS policies (conceptual index)**  
Exact policy SQL lives with the same migration, but the rules are:

- `companies`  
  - SELECT: optional for `authenticated` (or service only).  
  - INSERT/UPDATE/DELETE: `service_role` only.

- `company_memberships`  
  - SELECT: `user_id = auth.uid()` (if exposed to app) and `service_role`.  
  - INSERT/UPDATE/DELETE: `service_role` only.

- `company_invites`  
  - All access: `service_role` only (used via Worker).

---

### A6) RLS Test Helpers

**10. JWT simulation for RLS tests**  

Used in psql to simulate logged-in users:

```sql
SELECT set_config(
  'request.jwt.claims',
  json_build_object('role','authenticated','sub','<USER_UUID>')::text,
  true
);

SELECT auth.uid();  -- should echo <USER_UUID>


***************

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
# Part 6 — Companies, Memberships & Invites (Oct 2025)

0) What we’re building (plain English)

We added companies and company memberships so a user can belong to a company, and companies can invite additional users (e.g. sales teammates).

Right now:
	•	RFQs are still owned by user_id (as before).
	•	Company is used for:
	•	Gating the UI (buyers/sellers must belong to a company to use the app).
	•	Inviting additional users into a company.
	•	All company writes go through the Cloudflare Worker using the Supabase service key (RLS-safe; no client-side service key).

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
	•	Example: "Acme Demo" vs "acme demo" → rejected with 23505 (we saw this in tests)

Usage:
	•	Created only via the Worker endpoint /company/create (using the service key).
	•	Not directly writable from the frontend.

⸻

B) public.company_memberships
Each row connects a user to a company, with a track and a role level.

Columns (current shape):
	•	id uuid primary key
	•	company_id uuid not null references public.companies(id)
	•	user_id uuid not null references auth.users(id)
	•	track text not null
	•	"procurement" → buyer-side roles
	•	"sales" → seller-side roles
	•	role_level int not null
	•	30 = “manager” (e.g. procurement manager)
	•	10 = basic member
	•	created_at timestamptz default now()
	•	updated_at timestamptz default now()

Constraints:
	•	company_memberships_company_id_user_id_key — unique (company_id, user_id)
	•	Same user cannot join the same company twice.
	•	We removed old columns like role and is_primary (these caused 400/42703 errors and were removed in the final schema).

Usage:
	•	When a user creates a company:
	•	Insert membership with:
	•	track = 'procurement'
	•	role_level = 30 (manager)
	•	When a user accepts a company invite:
	•	Insert membership with:
	•	track = 'sales'
	•	role_level = 10
	•	Our Worker helper getCompanyIdForUser(env, userId) queries this table (with the service key) and attaches user.company_id to the authenticated user object.

Note: Right now we pick the first membership row; if a user ever has multiple companies, we’d need a “primary” flag or a way to choose which membership is active.

⸻

C) public.company_invites
Invites allow an existing company member to bring another user into their company by email.

Columns:
	•	id uuid primary key
	•	company_id uuid not null references public.companies(id)
	•	email text not null
	•	invited_by uuid not null references auth.users(id)  — who sent the invite
	•	status text not null default 'pending'
	•	'pending' | 'accepted' | 'cancelled' | 'expired' (we currently use pending/accepted)
	•	token uuid not null unique — invite token used by the accept endpoint
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
	•	{ "name": "Acme Demo" }
	•	Flow:
	1.	Validate name is non-empty.
	2.	Insert into public.companies with the service key.
	3.	Insert a company_memberships row for the caller:
	•	track = 'procurement'
	•	role_level = 30
	4.	Return { companyId, name, membershipId }.
	•	DB guarantees:
	•	If name clashes case-insensitively, Postgres raises 23505 (ux_companies_lower_name) and we send a 500 with "duplicate key value violates unique constraint \"ux_companies_lower_name\"".

⸻

/company/invite (POST)
	•	Auth: requires Supabase JWT + a membership (so user.company_id is present).
	•	Input (JSON):
	•	{ "email": "someone@example.com" }
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
	•	Notes:
	•	Invite rows are internal; UI will typically send the token via a link (e.g. in email) and the invitee will accept from a logged-in session.

⸻

/company/accept (POST)
	•	Auth: requires Supabase JWT for the invitee.
	•	Input (JSON):
	•	{ "token": "<invite-token-uuid>" }
	•	Flow:
	1.	Validate token is present.
	2.	Lookup invite:
	•	company_invites?token=eq.<token>&status=eq.pending (service key).
	•	If none → { error: "invalid_or_expired" } with 404.
	3.	Create membership:
	•	Insert into company_memberships:
	•	company_id = invite.company_id
	•	user_id = auth.user.id
	•	track = 'sales'
	•	role_level = 10
	•	If the unique constraint (company_id, user_id) fires (23505), treat it as “already a member” and fetch the existing membership instead of crashing.
	4.	Mark invite as accepted:
	•	status = 'accepted'
	•	accepted_at = now()
	5.	Return:
	•	{ ok: true, company_id, membership_id }
	•	Behavior:
	•	Endpoint is effectively idempotent for an invitee:
	•	First call creates membership.
	•	Later calls with same token/user see the duplicate key but still resolve to the existing membership and mark invite accepted.

⸻

3) RLS & Access Rules (high-level)

We keep the same “server-only writes” pattern:
	•	Read paths:
	•	For now, most company reads (like getCompanyIdForUser) are done from the Worker using the service key, so RLS can be very strict (no direct client SELECT needed).
	•	If we later expose “My company” to the UI, we’ll either:
	•	Add invoker views with user-aware filters, or
	•	Keep reads via Worker + service key and just expose a minimal API.
	•	Write paths:
	•	Only the service role writes:
	•	INSERT / UPDATE on companies
	•	INSERT / UPDATE on company_memberships
	•	INSERT / UPDATE on company_invites
	•	The React app never gets the service key.
	•	Recommended RLS shape (what we’re following conceptually):
	•	companies:
	•	Allow SELECT to authenticated (if we want users to see company names), or keep it service-only.
	•	Writes only via service role.
	•	company_memberships:
	•	SELECT restricted to:
	•	user_id = auth.uid() for end users (if we ever expose it directly), or
	•	service role.
	•	Writes only via service role (Worker).
	•	company_invites:
	•	SELECT/INSERT/UPDATE only via service role.
	•	No direct app access; only through Worker endpoints.

⸻

4) UI Contract (for later readers)
	•	Frontend never talks to Supabase directly for company operations.
	•	Frontend uses worker client services:
	•	createCompany(name) → calls Worker /company/create
	•	inviteCompanyUser(email) → calls Worker /company/invite
	•	acceptCompanyInvite(token) → calls Worker /company/accept
	•	Auth:
	•	Auth still uses Supabase JWT.
	•	requireUser in Worker validates JWT and attaches user.company_id by looking up company_memberships with the service key.
	•	RFQs:
	•	Still keyed by user_id (owner).
	•	Company-level RFQ scoping is not enforced yet; future phases can add company_id to RFQs and adjust RLS accordingly.
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