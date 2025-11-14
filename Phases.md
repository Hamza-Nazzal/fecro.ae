i said:

ok before moving forward, give me full detailed plan, phase by phase, type it down in a way that is good to be used in future as prompt to explain whats going on.

what we will do is we will keep this master plan saved in my desktop and every time i feel like i need to start a new chat i will paste it there and point out which stage i reached so that it will be smooth switch between chats.

do not leave anything to luck or guess, hard facts only plan, if you do not have all the facts type on top of the phase where those facts are needed, type what more details you want to know to execute the phase and whats the method to follow to get to the facts.

reminder, we can work with cursor, codex, terminal, cloudflare, supabase, and i can signup to resend.

 Do not rush your reply. i dont care how much time you take, deep think about this and make it bullet proof safe to follow plan. review it few times to make sure its accurate 

 you said:
 Hubgate.ae — Master Execution Plan (Admin-First, Worker-Centric, RLS-Backed)

Purpose: This document is the single source of truth for standing up Hubgate with an admin invite flow, domain flip, Worker API, and scalable DB/RLS.
How to use: Save this file on your desktop. Each time you open a new chat (Cursor/Codex/etc.), paste the relevant Phase section(s) and state your current Progress Marker (e.g., “Completed Phase 2; starting Phase 3, step 2.”).
Stack: React + Tailwind (FE), Cloudflare Worker (API), Supabase (Auth + DB + Storage), Resend (email).
Non-negotiables:
	•	No service role key in frontend.
	•	Worker is the API gateway.
	•	Postgres RLS is the authority for data access.
	•	Company rule + Category rule enforced in DB; mirrored in Worker.

⸻

Phase Index
	1.	Domain Plumbing (hubgate.ae)
	2.	Worker Backbone (minimal, admin-first)
	3.	Admin UI: Companies + User Invites (go live first)
	4.	Public Signup + Onboarding (invite-based)
	5.	Scalable Data & RLS Foundation
	6.	Seller Discovery & Quotes via Worker
	7.	DB View Versioning & FE Schema Insulation
	8.	Hardening: Flags, CORS, Rate-limits, Logs
	9.	Ops: Monitoring, Backups, Rollback

Each phase below includes: Facts Needed → Method to Obtain, Deliverables, Steps, Acceptance Checks, Artifacts to Save, Rollback.

⸻

Phase 1 — Domain Plumbing (hubgate.ae)

Facts Needed → Method to Obtain
	•	App host / API host: fixed as app.hubgate.ae and api.hubgate.ae (decided).
	•	Supabase project URL & anon key: Terminal → your current .env | Supabase → Project Settings.
	•	Resend sender domain: hubgate.ae (use noreply@hubgate.ae).

Deliverables
	•	DNS records for app, api, (optional) signup.
	•	Supabase Auth: Site URL, Redirect URLs, Allowed Origins (CORS) updated for new hosts.
	•	Resend domain verified (DKIM/DMARC).

Steps
	1.	Cloudflare DNS
	•	A/CNAME app.hubgate.ae → frontend hosting.
	•	A/CNAME api.hubgate.ae → Cloudflare Worker routes.
	•	(Optional) signup.hubgate.ae → static landing (can point to app until ready).
	2.	Supabase Auth
	•	Site URL: https://app.hubgate.ae
	•	Redirect URLs: add https://api.hubgate.ae/auth/redirect
	•	Allowed Origins (CORS): https://app.hubgate.ae, https://api.hubgate.ae
	3.	Resend
	•	Verify domain (hubgate.ae), add DNS for SPF/DKIM/DMARC in Cloudflare.
	•	Choose sender: noreply@hubgate.ae.

Acceptance Checks
	•	Visiting app.hubgate.ae loads the app shell.
	•	curl -I https://api.hubgate.ae returns a 200/404 from Worker entry (once Phase 2 is deployed).
	•	Resend shows verified status for hubgate.ae.

Artifacts to Save
	•	Screenshot of Supabase Auth settings (Site URL / Redirects / CORS).
	•	Cloudflare DNS screenshot.
	•	Resend verification status.

Rollback
	•	Keep fecro.ae entries intact until Phase 3 passes; revert DNS to old hosts if needed.

⸻

Phase 2 — Worker Backbone (minimal, admin-first)

Facts Needed → Method to Obtain
	•	Cloudflare account & wrangler installed: Terminal: wrangler --version.
	•	Supabase Service Role (Worker env only): Supabase → Project Settings → API.
	•	Admin allowlist: emails of SuperAdmins (you can start with your own email).

Deliverables
	•	Worker deployed at api.hubgate.ae with endpoints:
	•	GET /admin/whoami (SuperAdmin check via email allowlist).
	•	POST /admin/companies.create (writes to stub table for now).
	•	POST /admin/users.invite (Supabase Admin invite + optional Resend email).
	•	GET /auth/redirect (verifies Supabase token; redirects to app).
	•	Strict CORS: allow only https://app.hubgate.ae.

Steps (outline)
	1.	Worker project
	•	wrangler.toml:
	•	name = "hubgate-api"
	•	routes for api.hubgate.ae/*
	•	vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE, ADMIN_SUPERADMINS, CORS_ALLOWED_ORIGINS, RESEND_API_KEY, RESEND_FROM
	2.	Middleware
	•	CORS preflight; block unknown origins.
	•	Auth util: verify Supabase JWT using JWKS (or Supabase client auth.getUser() with Service Role).
	3.	Endpoints (behavioral contract)
	•	GET /admin/whoami:
	•	Read Authorization: Bearer <supabase_jwt>; verify; return {isAdmin:true,email,user_id} if email in allowlist; else 401.
	•	POST /admin/companies.create (Admin only):
	•	Body: { name*, legal_name?, trn?, phone?, email?, address_line1?, address_line2?, city?, country?, notes? }.
	•	Insert into public.admin_companies (stub) for now; return created row.
	•	POST /admin/users.invite (Admin only):
	•	Body: { email*, company_id*, track: "sales"|"procurement", level?: number, first_name?, last_name?, phone?, notes? }.
	•	Create/invite user via Supabase Admin.
	•	OPTIONAL: send branded email via Resend with CTA → https://api.hubgate.ae/auth/redirect?type=signup&token=....
	•	Insert row into public.admin_user_invites (stub log).
	•	GET /auth/redirect:
	•	Validate token with Supabase.
	•	302 to https://app.hubgate.ae/onboarding (keep query params as needed).
	4.	Stub tables (idempotent SQL you can run in Supabase SQL editor):

create table if not exists public.admin_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  trn text,
  phone text,
  email text,
  address_line1 text,
  address_line2 text,
  city text,
  country text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.admin_user_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  company_id uuid not null,
  track text not null check (track in ('sales','procurement')),
  level int default 30,
  status text default 'created',
  created_at timestamptz default now()
);

(No RLS on stubs yet; Worker restricts access.)

	5.	Deploy: wrangler deploy

Acceptance Checks
	•	curl -H "Origin: https://app.hubgate.ae" https://api.hubgate.ae/admin/whoami → 401 (no token).
	•	With a valid Supabase session JWT: returns {isAdmin:true,...} for allowlisted email.
	•	POST /admin/companies.create inserts a row.
	•	POST /admin/users.invite creates invite and (optionally) sends email via Resend.
	•	GET /auth/redirect?... returns 302 to https://app.hubgate.ae/onboarding.

Artifacts to Save
	•	wrangler.toml, Worker source, curl transcripts (200/401/302).

Rollback
	•	Disable route in Cloudflare or rollback to previous Worker version.

⸻

Phase 3 — Admin UI (Companies + Invites) — Go Live First

Facts Needed → Method to Obtain
	•	App routes file path and where to mount /admin/users: Cursor search “Route path” patterns.
	•	Auth hook to retrieve user token: existing useAuth().

Deliverables
	•	/admin/users page with two tabs:
	•	Add Company → calls POST /admin/companies.create
	•	Invite User → company dropdown via GET /admin/companies.list?q=..., invite via POST /admin/users.invite
	•	Server-validated guard: calls GET /admin/whoami (do not rely on localStorage alone).
	•	“Recent invites” list (from last responses; later can back by /admin/invites.list).

Steps
	1.	Create page & guard
	•	On mount, call /admin/whoami; if not isAdmin, redirect to /admin/login.
	2.	Add Company form
	•	Required: name. Optional: the rest. Disable submit while pending. Toast results.
	3.	Invite User form
	•	Searchable company select via /admin/companies.list?q= (implement this GET endpoint if not already).
	•	Inputs: email (required), track (sales|procurement), optional level (default 30), names, phone, notes.
	4.	UX
	•	Inline validation, error banners, success toasts.
	•	Record last 10 actions locally (or fetch if endpoint exists later).

Acceptance Checks
	•	Visiting /admin/users with a valid SuperAdmin session shows forms.
	•	Create a company → appears in dropdown.
	•	Invite user → email received (if Resend enabled) OR Worker returns invite created.

Artifacts to Save
	•	Screenshots, JSON responses.

Rollback
	•	Hide /admin/users route; Worker remains intact.

⸻

Phase 4 — Public Signup + Onboarding (Invite-based)

Facts Needed → Method to Obtain
	•	Onboarding fields: first_name, last_name, phone, agree_to_terms (decided).
	•	Terms/Privacy links: temporarily link to placeholder pages.

Deliverables
	•	/signup landing (invite-only message; optional request-invite stub).
	•	/onboarding form to complete profile after redirect.
	•	Worker /auth/redirect already in place (Phase 2).

Steps
	1.	/signup
	•	Simple copy: “We’re invite-only. Check your email for an invite.”
	•	Optional: “Request invite” form → POST /waitlist (stub OK).
	2.	/onboarding
	•	Show role track(s) from invite (read via session or query).
	•	Collect first/last name, phone, accept terms.
	•	Submit to a placeholder endpoint (can be Worker or direct Supabase if minimal).
	•	Redirect to app home.

Acceptance Checks
	•	Clicking invite email CTA → hits /auth/redirect → redirects to /onboarding.
	•	Completing onboarding stores profile fields and navigates to app home.

Artifacts to Save
	•	Video capture of invite→redirect→onboarding→home.

Rollback
	•	Keep /signup closed (message only). Disable onboarding route if needed.

⸻

Phase 5 — Scalable Data & RLS Foundation

Hard facts we verified earlier: RLS is enabled on rfqs & quotations; current policies leak status='active'; no company columns; v_rfqs_card minimal.

Facts Needed → Method to Obtain
	•	None blocking; we already know we must add org tables/columns and new policies.

Deliverables
	•	Tables:
	•	companies
	•	company_memberships (user_id, company_id, track, role_key, level, reports_to_id, is_active)
	•	company_category_permissions (company_id, category_id, scope='sell')
	•	category_closure (ancestor_id, descendant_id, depth) or a fast recursive function.
	•	Columns:
	•	rfqs: buyer_company_id uuid, created_by_membership_id uuid
	•	quotations: seller_company_id uuid, created_by_membership_id uuid
	•	Policies (default-deny, specific allow):
	•	RFQ INSERT: only if caller’s membership.track = 'procurement'; set buyer_company_id from membership.
	•	RFQ SELECT (seller): rfqs.buyer_company_id <> current_company() AND rfqs.category_id in seller_allowed_descendants(current_company()).
	•	Quotation INSERT: membership.track = 'sales' AND seller_company_id = current_company() AND seller_company_id <> (select buyer_company_id from rfqs where id=rfq_id) AND RFQ category eligible.
	•	Quotation SELECT: seller side (own/team) and buyer side (on their RFQs).
	•	Remove/replace leaky rfqs_read_owner_or_active.

Steps
	1.	DDL (outline)

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  company_id uuid not null references public.companies(id),
  track text not null check (track in ('sales','procurement')),
  role_key text not null check (role_key in ('seller','buyer')),
  level int not null default 30,
  reports_to_id uuid null references public.company_memberships(id),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  unique (user_id, company_id)
);

alter table public.rfqs
  add column if not exists buyer_company_id uuid,
  add column if not exists created_by_membership_id uuid;

alter table public.quotations
  add column if not exists seller_company_id uuid,
  add column if not exists created_by_membership_id uuid;

-- category_closure & company_category_permissions similarly (omitted for brevity).


	2.	Backfill (controlled)
	•	Create demo companies and memberships for your existing demo users.
	•	Backfill rfqs.buyer_company_id from RFQ owner’s membership, quotations.seller_company_id from seller’s membership.
	•	Do this inside a transaction; temporarily relax policies only if necessary.
	3.	RLS Policies (outline pseudo-SQL)

-- RFQs: default deny, then:
create policy rfqs_insert_procurement on public.rfqs
  for insert to authenticated
  with check ( exists (
    select 1 from public.company_memberships m
    where m.user_id = auth.uid() and m.track = 'procurement'
    and rfqs.buyer_company_id = m.company_id
  ));

create policy rfqs_select_visibility on public.rfqs
  for select to authenticated
  using (
    -- owner or permitted seller team visibility:
    buyer_company_id = (select company_id from public.company_memberships where user_id = auth.uid() limit 1)
    OR (
      buyer_company_id <> (select company_id from public.company_memberships where user_id = auth.uid() limit 1)
      AND rfqs.category_id in (
        /* function returning allowed descendant categories for seller’s company */
        select descendant_id from public.category_closure
        where ancestor_id in (
          select category_id from public.company_category_permissions
          where company_id = (select company_id from public.company_memberships where user_id = auth.uid() limit 1)
          and scope = 'sell'
        )
      )
    )
  );

-- Quotations: INSERT guard (no self-quote, correct track, category eligible)
create policy quotations_insert_sales on public.quotations
  for insert to authenticated
  with check (
    exists (select 1 from public.company_memberships m where m.user_id=auth.uid() and m.track='sales'
            and quotations.seller_company_id = m.company_id)
    and quotations.seller_company_id <> (select buyer_company_id from public.rfqs where id = quotations.rfq_id)
    and exists (
      select 1 from public.rfqs r
      where r.id = quotations.rfq_id
        and r.category_id in ( /* same allowed-descendants logic for seller’s company */ 
        select descendant_id from public.category_closure
        where ancestor_id in (
          select category_id from public.company_category_permissions
          where company_id = quotations.seller_company_id and scope='sell'
        ))
    )
  );

(Fine-tune with your exact schema; keep “default deny” baseline.)

Acceptance Checks
	•	No self-quote possible (DB enforces).
	•	Seller cannot see RFQs of own company.
	•	Seller sees only RFQs in allowed category descendants.
	•	Buyer can create/view own RFQs.
	•	Old leaky policy is removed/replaced.

Artifacts to Save
	•	SQL migration files in VCS.
	•	Backfill scripts and execution transcript.

Rollback
	•	Keep a DB snapshot (Supabase backup) before applying migrations.
	•	Revert policies and column additions if required; restore snapshot on failure.

⸻

Phase 6 — Seller Discovery & Quotes via Worker

Facts Needed → Method to Obtain
	•	None blocking. We already have Worker and RLS.

Deliverables
	•	GET /rfqs/discover — server injects company + category filters, paginates/sorts.
	•	POST /quotes — Worker derives seller_company_id from membership, validates against RFQ, inserts quotation.

Steps
	1.	/rfqs/discover
	•	From user JWT → resolve company and allowed category set (cache optional).
	•	Query view/table with filters:
	•	buyer_company_id <> my_company
	•	category_id in my_allowed_descendants
	•	status = 'active' (optional if “published”, but do not rely on old leaky policy).
	•	Return minimal fields needed for cards.
	2.	/quotes
	•	Ignore client’s company fields.
	•	Derive seller_company_id; validate inequality vs RFQ’s buyer_company_id and category eligibility.
	•	Insert into quotations.

Acceptance Checks
	•	Seller sees only eligible RFQs.
	•	Attempting self-quote returns 403/409 from Worker (and would fail at DB anyway).

Artifacts to Save
	•	Endpoint contracts (OpenAPI stub or simple markdown).

Rollback
	•	Feature flag to disable discovery route; quotes route can be restricted to “drafts only”.

⸻

Phase 7 — DB View Versioning & FE Schema Insulation

Facts Needed → Method to Obtain
	•	Current FE fields for RFQ cards/search (we know FE referenced title, first_category_path before; update to what you actually need).

Deliverables
	•	Version-controlled v_rfqs_card that includes exact columns the API returns:
	•	id, public_id, title, category_id, buyer_id, buyer_company_id, status, created_at, items_count
	•	(Add additional derived fields only if truly used.)
	•	Worker maps DB fields → FE DTO (so DB changes don’t break FE).

Steps
	1.	Create/Update View

create or replace view public.v_rfqs_card as
select
  r.id,
  r.public_id,
  r.title,
  r.category_id,
  r.user_id as buyer_id,
  r.buyer_company_id,
  r.status,
  r.created_at,
  (select count(*) from public.rfq_items i where i.rfq_id = r.id) as items_count
from public.rfqs r;


	2.	Use view in Worker; FE never queries the table directly for discovery.

Acceptance Checks
	•	FE card list renders with new DTO; no missing fields.

Artifacts to Save
	•	SQL for view; API response schema.

Rollback
	•	Keep previous view definition; revert if needed.

⸻

Phase 8 — Hardening: Flags, CORS, Rate-limits, Logs

Facts Needed → Method to Obtain
	•	Origins list (we have app.hubgate.ae), any preview hosts.

Deliverables
	•	Feature flags: enable/disable discovery.
	•	CORS locked strictly to allowed origins.
	•	Basic rate-limit on invite & discovery endpoints.
	•	Structured logs for admin actions.

Steps
	•	Worker: add X-Request-Id, structured JSON logs.
	•	Simple in-memory or KV rate-limit (by user id / IP).
	•	Configurable flags via Worker env (e.g., FEATURE_SELLER_DISCOVERY=off).

Acceptance Checks
	•	Disabling the discovery flag returns 403/404.
	•	CORS preflight works for allowed origin; blocked for others.
	•	Logs show invite/discovery events with user ids.

Artifacts to Save
	•	Env var config doc, log samples.

Rollback
	•	Turn flags off; relax CORS only if necessary.

⸻

Phase 9 — Ops: Monitoring, Backups, Rollback

Facts Needed → Method to Obtain
	•	Supabase backup schedule (check project settings).
	•	Cloudflare Analytics availability (enabled by default).

Deliverables
	•	Manual rollback notes:
	•	DNS switch back plan.
	•	Worker previous version ID.
	•	DB: snapshot/restore procedure.
	•	Smoke test checklist (one-page): login, invite, redirect, onboarding, discovery (if enabled), quote insert.

Steps
	•	Document wrangler versions and how to roll back.
	•	Schedule/verify DB backups (daily).
	•	Keep a pre-migration snapshot before Phase 5.

Acceptance Checks
	•	You can roll back Worker within minutes.
	•	You can restore a DB snapshot in staging (test at least once).

Artifacts to Save
	•	Rollback runbook (markdown), backup verification screenshot.

⸻

Environment Variables (consolidated)

Worker (Cloudflare):
	•	SUPABASE_URL
	•	SUPABASE_SERVICE_ROLE
	•	ADMIN_SUPERADMINS (comma-separated emails)
	•	CORS_ALLOWED_ORIGINS= https://app.hubgate.ae
	•	RESEND_API_KEY (optional if Worker sends emails)
	•	RESEND_FROM=noreply@hubgate.ae
	•	FEATURE_SELLER_DISCOVERY=off|on (flag)
	•	(Optional) KV_NAMESPACE for caching category closures/rate-limits

Frontend:
	•	VITE_APP_ORIGIN=https://app.hubgate.ae
	•	VITE_API_ORIGIN=https://api.hubgate.ae
	•	VITE_SUPABASE_URL
	•	VITE_SUPABASE_ANON_KEY

⸻

Tripwires (Quick Tests Before Unlocking Each Phase)
	•	P1→P2: api.hubgate.ae resolves; CORS preflight returns correct headers.
	•	P2→P3: /admin/whoami rejects w/o token; accepts allowlisted admin.
	•	P3→P4: Invite email CTA opens /auth/redirect and lands on /onboarding.
	•	P4→P5: User profile stored, session persists on reload.
	•	P5→P6: SQL proofs: no self-quote; seller can’t see own-company RFQs; category gating works.
	•	P6→P7: Discovery API returns only eligible RFQs; pagination stable (order by created_at desc, id desc).
	•	P7→P8: FE no longer depends on table schema; view/API contract stable.
	•	P8→P9: Feature flag kills discovery immediately; logs show who invoked what.

⸻

Risk Register (what can break + mitigation)
	•	Leaky legacy policy (status='active') → Remove/replace in P5.
	•	Service role exposure → Keep service role strictly in Worker env; never bundle in FE.
	•	Stale invites after domain flip → Use Worker /auth/redirect as canonical target in emails.
	•	Category closure performance → Add indexes; consider caching in Worker KV.
	•	Backfill gaps → Create memberships first; backfill in a transaction; log orphans.

⸻

Progress Marker (fill this when you switch chats)
	•	Phase 1: ☐ planned ☐ done
	•	Phase 2: ☐ planned ☐ deployed (endpoints responding)
	•	Phase 3: ☐ UI mounted ☐ invites flowing
	•	Phase 4: ☐ landing ☐ onboarding writing profile
	•	Phase 5: ☐ migrations applied ☐ policies green (tests pass)
	•	Phase 6: ☐ discovery on Worker ☐ quotes via Worker
	•	Phase 7: ☐ view versioned ☐ FE insulated
	•	Phase 8: ☐ flags/CORS/logs in place
	•	Phase 9: ☐ rollback tested ☐ backups verified

⸻

This plan is ready to paste into any new session as a guide. When you’re ready to execute a specific phase, say which Phase and I’ll turn that section into an execution checklist with concrete commands, SQL, and (if you want) prompt text for Cursor/Codex.

