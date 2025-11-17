# Hubgate.ae – Execution Checklist

> Rule: Don’t tick a box unless you ran the test **today** and it passed.

D=DONE / N=NOT DONE / U=UNKNOWN
---

## Phase 1 — Domain Plumbing (hubgate.ae)

### P1.1 DNS

- [U] P1.1.1 `dig +short app.hubgate.ae` returns an IP or CNAME
- [U] P1.1.2 `dig +short api.hubgate.ae` returns an IP or CNAME

### P1.2 Worker reachable on api.hubgate.ae

- [D] P1.2.1 `curl -I https://api.hubgate.ae` returns 200/404 (Cloudflare headers OK)
- [D] P1.2.2 `curl -I https://api.hubgate.ae/health` or `/api/health` returns 200/404 (no TLS error)

### P1.3 Supabase Auth config

- [U] P1.3.1 Site URL is `https://app.hubgate.ae`
- [U] P1.3.2 Redirect URLs include `https://api.hubgate.ae/auth/redirect`
- [U] P1.3.3 Allowed origins include `https://app.hubgate.ae` and `https://api.hubgate.ae`

### P1.4 Resend

- [U] P1.4.1 Domain `hubgate.ae` is verified in Resend
- [U] P1.4.2 Sender `noreply@hubgate.ae` is active

---

## Phase 2 — Worker Backbone (minimal, admin-first)

_All tests from `hubgate-api` repo with `wrangler dev` running._

### P2.1 Health & CORS

- [D] P2.1.1 `curl -I http://localhost:8787/api/health` → 200 JSON
- [D] P2.1.2 `curl -H "Origin: http://localhost:3000" -I http://localhost:8787/api/health` → includes `Access-Control-Allow-Origin: http://localhost:3000`

### P2.2 Admin whoami

- [D] P2.2.1 `curl -v http://localhost:8787/admin/whoami` → 401 `{"error":"unauthorized"}` (already seen)
- [N] P2.2.2 Get a valid Supabase JWT for an admin user
- [N] P2.2.3 `curl -v http://localhost:8787/admin/whoami -H "Authorization: Bearer <JWT>"` → 200 `{ "ok": true, "role": "SuperAdmin", ... }`

### P2.3 Admin users.invite (raw, from curl)

- [U] P2.3.1 `curl -v http://localhost:8787/admin/users.invite` (no body) → 400 with `email required`
- [N] P2.3.2 `curl -v -X POST http://localhost:8787/admin/users.invite -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" -d '{"email":"test@example.com","roles":["seller"]}'` → 200 and Supabase Admin shows invite created

### P2.4 Auth redirect

- [U] P2.4.1 `curl -v "http://localhost:8787/auth/redirect?test=1"` → 302 to `https://app.hubgate.ae/auth/callback?...`

---

## Phase 3 — Admin UI (Companies + Invites)

_All tests from `fecro.ae` frontend on `localhost:3000`._

### P3.1 Guarded admin route

- [U] P3.1.1 Visiting `/admin/users` while logged **out** shows “not authorized” or redirects away
- [U] P3.1.2 Visiting `/admin/users` while logged in as admin calls `GET /admin/whoami` on `http://localhost:8787` (check DevTools → Network)
- [U] P3.1.3 If whoami 401s, UI shows a proper error (no infinite spinner)

### P3.2 Add Company via Worker

- [N] P3.2.1 Fill “Add Company” form and submit
- [N] P3.2.2 DevTools: request goes to `POST http://localhost:8787/company/create`
- [N] P3.2.3 Supabase table `admin_companies` (or final table name) has the new row

### P3.3 Invite User via Worker

- [N] P3.3.1 Invite a user from Admin UI
- [N] P3.3.2 DevTools: request goes to `POST http://localhost:8787/company/invite` or `/admin/users.invite`
- [N] P3.3.3 Supabase `admin_user_invites` (or final table) has a new row
- [N] P3.3.4 (If Resend configured) User receives invite email

---

## Phase 4 — Public Signup + Onboarding

### P4.1 Invite → redirect

- [ ] P4.1.1 Click invite link in email
- [ ] P4.1.2 URL first hits `https://api.hubgate.ae/auth/redirect?...`
- [ ] P4.1.3 Browser is redirected to `https://app.hubgate.ae/onboarding?...`

### P4.2 Onboarding form

- [ ] P4.2.1 On `/onboarding`, form shows first/last name, phone, accept terms
- [ ] P4.2.2 Submitting writes profile row into your `profiles` (or equivalent) table
- [ ] P4.2.3 After submit, user lands on main app home page and stays logged in on refresh

---

## Phase 5 — Scalable Data & RLS Foundation

### P5.1 Schema

- [ ] P5.1.1 `select 1 from public.companies limit 1;` works (table exists)
- [ ] P5.1.2 `select 1 from public.company_memberships limit 1;` works
- [ ] P5.1.3 `select buyer_company_id, created_by_membership_id from public.rfqs limit 1;` works
- [ ] P5.1.4 `select seller_company_id, created_by_membership_id from public.quotations limit 1;` works

### P5.2 Backfill sanity

- [ ] P5.2.1 `select count(*) from public.company_memberships;` > 0
- [ ] P5.2.2 `select count(*) from public.rfqs where buyer_company_id is not null;` > 0
- [ ] P5.2.3 `select count(*) from public.quotations where seller_company_id is not null;` > 0

### P5.3 RLS behavior

- [ ] P5.3.1 As a buyer user: can select own RFQs; cannot see RFQs from another test company
- [ ] P5.3.2 As a seller user: cannot see RFQs where `buyer_company_id = my_company`
- [ ] P5.3.3 As a seller user: can see RFQs only in allowed categories (spot-check with one allowed and one forbidden category)
- [ ] P5.3.4 Attempt to insert a quotation where `seller_company_id = buyer_company_id` fails at DB level

---

## Phase 6 — Seller Discovery & Quotes via Worker

### P6.1 RFQ discovery via Worker

- [ ] P6.1.1 On seller RFQ wall, DevTools shows RFQ list request to `http://localhost:8787/seller/rfqs` (not Supabase REST URL)
- [ ] P6.1.2 A manual `curl -v "http://localhost:8787/seller/rfqs?page=1&pageSize=10"` with a valid seller JWT returns only RFQs from other companies, correct categories

### P6.2 Quote creation via Worker

- [ ] P6.2.1 On seller quote screen, DevTools shows quote submit hitting `POST http://localhost:8787/quotes` (or your final endpoint)
- [ ] P6.2.2 Attempting to quote your own company’s RFQ returns 403/409 from Worker
- [ ] P6.2.3 Valid quote insert appears in `quotations` with correct `seller_company_id` set from membership, not from client

---

## Phase 7 — DB View Versioning & FE Insulation

### P7.1 Card view definition

- [ ] P7.1.1 `select * from public.v_rfqs_card limit 1;` works
- [ ] P7.1.2 Columns include: `id, public_id, title, category_id, buyer_id, buyer_company_id, status, created_at, items_count`

### P7.2 FE only uses view via Worker

- [ ] P7.2.1 Code search: FE does **not** call `rfqs` table directly for cards (only Worker → view)
- [ ] P7.2.2 Worker discovery endpoint selects from `v_rfqs_card` (not raw `rfqs`)

---

## Phase 8 — Hardening: Flags, CORS, Rate-limits, Logs

### P8.1 Feature flags

- [ ] P8.1.1 `FEATURE_SELLER_DISCOVERY` (or similar) exists in Worker env
- [ ] P8.1.2 When flag is OFF, `GET /seller/rfqs` returns 404/403 even with valid token
- [ ] P8.1.3 When flag is ON, `/seller/rfqs` works again without redeploying code (only env change)

### P8.2 Rate limiting

- [ ] P8.2.1 Hitting `/admin/users.invite` in a loop eventually returns a rate-limit response (429 or custom)
- [ ] P8.2.2 Hitting `/seller/rfqs` very fast logs rate-limit events (if implemented)

### P8.3 Structured logs

- [ ] P8.3.1 Worker logs for some request include structured JSON with at least: `requestId`, `path`, `userId` (if authenticated)

---

## Phase 9 — Ops: Monitoring, Backups, Rollback

### P9.1 Worker rollback

- [ ] P9.1.1 `wrangler deployments list` shows at least 2 versions
- [ ] P9.1.2 You have written steps: “How to roll back Worker to previous deployment X”
- [ ] P9.1.3 You test rollback once on a non-critical change and confirm /api/health responds with the old version’s behavior

### P9.2 DB backups

- [ ] P9.2.1 Supabase project shows automatic backups enabled
- [ ] P9.2.2 You have written notes: where backups are listed and how to restore
- [ ] P9.2.3 You restore a backup into a **separate** project or schema at least once to prove it works

### P9.3 Smoke test checklist

- [ ] P9.3.1 You have a 1-page “smoke test” list that covers: login, admin invite, invite email link, onboarding, seller discovery, quote insert
- [ ] P9.3.2 After any major change, you can run the smoke test in < 15 minutes

---