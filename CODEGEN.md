/* 

ARNING in [eslint] 
src/hooks/useRFQ.js
  Line 8:31:  'useMemo' is defined but never used                                                                                                no-unused-vars
  Line 8:40:  'useRef' is defined but never used                                                                                                 no-unused-vars
  Line 9:10:  'useOnceEffect' is defined but never used                                                                                          no-unused-vars
  Line 99:6:  React Hook useEffect has missing dependencies: 'user?.email' and 'user?.name'. Either include them or remove the dependency array  react-hooks/exhaustive-deps
start with the linter warnings



FECRO APP — CODEGEN BRIEF (READ BEFORE WRITING CODE)

Stack & Styling
- React (function components, hooks). No class components.
- TailwindCSS only for styling; no external CSS files. Prefer utility classes.
- Icons: lucide-react.
- Language: JavaScript today, but keep TypeScript-friendly shapes.

Architecture & Separation of Concerns
- Keep business logic OUTSIDE UI components:
  - Helpers/formatters/date utils live alongside services (e.g., `/src/services/*`) or in small modules under `/src/` (no DOM access).
  - Data services (IDs, storage, API calls) go in `/src/services/*` (we already have `rfqService.js`, `quotationsService.js`).
  - View-model hooks go in `/src/hooks/*` (we already have `useRFQ.js`, `useSubmitQuotation.js`).
  - Presentational components go in `/src/components/*` (e.g., `RequestCard.jsx`, `QuotationForm.jsx`).
- Components should be "thin": receive props, render UI, call callbacks.

State & Hooks
- No conditional hook calls; hooks are always top-level.
- Local state for local UI. If global is needed, create a dedicated context in `/src/contexts/*`.
- Timers: do NOT run a global 1s ticker. Use localized timers (e.g., <TimeAgo stepMs=30000>) and pause on `document.hidden`.

Data Model (RFQ)
- RFQ shape (extend, don't break): 
  {
    id,               // internal UUID
    userId,           // user who created this RFQ (for privacy filtering)
    publicId,         // RFQ-XXXXXX
    company, title, description,
    category, subCategory,
    quantity, orderType,          // 'one-time' | 'recurring'
    deliveryTime, customDate,     // 'today' | 'custom' (+ customDate)
    delivery, warranty, installation,
    postedTime,                   // ISO string
    status,                       // 'active' | 'paused' | 'closed' | 'cancelled'
    quotations, views
  }
- Status mapping for UI badges (RequestCard):
  active -> "Open", paused -> "Draft", closed -> "Closed", else -> "Inactive".

Data Model (Quotation)
- Quotation shape:
  {
    id,               // internal UUID
    rfq_id,           // references RFQ
    seller_id,        // user who created this quotation
    seller_company,   // seller's company name
    total_price,      // calculated total
    currency,         // AED, USD, etc.
    line_items,       // array of {item, quantity, unit_price, total}
    delivery_timeline_days,
    payment_terms,    // "Net 30", etc.
    shipping_terms,   // "FOB Origin", etc.
    validity_days,    // how long quote is valid
    notes,
    status,           // 'draft' | 'submitted' | 'accepted' | 'rejected' | 'withdrawn'
    created_at, updated_at, submitted_at, expires_at
  }

IDs & Services
- Use `rfqService.makeUUID()` and `rfqService.ensureUniquePublicId()` for IDs.
- Never inline `crypto` or random logic inside components.

Forms & UX
- Required fields (minimum): `title` and `description` for RFQs.
- Cancel on the Post screen MUST reset to `INITIAL_NEW_REQUEST` and clear any editing id.
- Editing a request updates in place and sets status back to `active` unless specified otherwise.
- Barcode lookup hydrates fields from PRODUCT_DB when available.

Performance
- Prefer memoized computations and small, focused components.
- Avoid app-wide re-renders for clocks; compute "time since" on render or with localized 30s intervals.
- Keep lists virtualizable in the future (don't couple list rendering tightly to parent state).

Accessibility & Semantics
- Buttons and interactive elements have `aria-*` where applicable.
- Keyboard and outside-click handling for menus and dialogs.

Conventions
- File layout:
  /src/App.js                         (shell & routing)
  /src/components/RequestCard.jsx     (presentational)
  /src/components/QuotationForm.jsx   (quotation submission)
  /src/components/SellerQuotationsTab.jsx (seller's quotation list)
  /src/hooks/useRFQ.js               (RFQ list state + CRUD via service)
  /src/hooks/useSubmitQuotation.js   (quotation form logic)
  /src/services/rfqService.js         (RFQ IDs, seeding, CRUD)
  /src/services/quotationsService.js  (quotation CRUD)
  /src/services/date.js, /src/services/format.js (optional small helpers)
- Names: helpers are camelCase; components PascalCase.
- Keep helpers pure; no DOM access inside them.
- Prefer small, testable functions over monolith handlers.

Prototype Mode (Velocity First)
- Only 3 rules:
  1) Single data boundary: all data access goes through `/src/services/rfqService.js` and `/src/services/quotationsService.js`.
  2) No SDK imports in UI: components/hooks must not import Supabase/AWS SDKs directly.
  3) Stable RFQ identity: keep { id (UUID), publicId (RFQ-XXXXXX) } consistent.

Don'ts
- Don't fetch or mutate inside render.
- Don't sprinkle business rules across components.
- Don't reintroduce global ticking `setInterval` in App.
- Don't bypass the service/hook layers for RFQ CRUD.

If you generate new features:
- Add new fields non-destructively to the RFQ shape.
- Put new data operations in `/src/services/*` and expose them via a hook in `/src/hooks/*`.
- Keep UI components stateless/presentational where possible.

⚠️ Data Backend Strategy
- We will use **Supabase** (Postgres + Auth + Storage) for MVP/demo deployment because it is fast, cheap (free tier), and developer-friendly.
- All data access must go through `/src/services/rfqService.js` and `/src/services/quotationsService.js` so we can swap backends with minimal changes.
- Treat Supabase as a **temporary/early-stage backend**. Later, if requirements change (enterprise compliance, scale, AWS-only mandates), we may migrate to **AWS RDS (Postgres) + Cognito + S3**.
- To keep migration easy:
  - Stick to **portable Postgres features** (avoid Supabase-only functions inside business logic).
  - Keep auth/user handling inside `AuthContext`.
  - Keep file storage paths & signed URL logic in services, not UI.
  - Ensure all queries go through service layers and never directly from components/hooks.

✅ Supabase vs AWS — Quick Decision Checklist
- SAFE TO STAY ON SUPABASE (any two of these true):
  - We're in MVP/early pilot; traffic and data sizes are small.
  - No enterprise customer is demanding VPC, SSO/SAML, or AWS-only.
  - Costs are predictable and within free/low tiers.
  - Realtime is a nice-to-have, not mission-critical.
- TIME TO SWITCH TO AWS (start planning if any apply):
  - Customer requires **private VPC**, **SSO/SAML**, or **AWS-only** compliance.
  - We need **network isolation**, KMS key control, or no public DB endpoints.
  - We are hitting **scale limits** (connections/throughput) or need multi-region/read replicas.
  - **Costs spike** on Supabase (storage/egress/auth MAUs) beyond planned budget.
  - We require deep AWS integrations (Step Functions, EventBridge, Lambda workflows, Redshift).

IMPORTANT: DOMAIN CHANGE CHECKPOINTS
Please warn before these critical stages if domain name needs to change:
- Database integration (Supabase/Firebase)
- SSL certificate setup
- Production deployment
- App store submission
- Payment integration (webhook URLs)
- Custom email setup (admin@fecro.ae)
- SEO/marketing setup (Analytics, Search Console)
Current domain: fecro.ae

Addendum — Implementation Notes (Sep 6, 2025)
Connectivity & Domain

To bypass ISP blocks on *.supabase.co, we use a Cloudflare Worker proxy + custom domain.

Frontend base URL: REACT_APP_SUPABASE_URL=https://api.fecro.ae (CRA env; restart after edits).

Worker envs (Cloudflare → Worker → Settings → Variables & Secrets)

SUPABASE_URL = https://<project_ref>.supabase.co

SUPABASE_ANON_KEY = <anon public key>

DNS: CNAME api → <project_ref>.supabase.co with Proxied (orange cloud) ON.

Workers Route: api.fecro.ae/* → sb-proxy (Worker). Failure mode: Fail open.

CORS: Worker reflects requested headers and limits origins to:

http://localhost:3000, https://fecro.ae, https://www.fecro.ae (extend as needed).

Diagnostics & Dev UX

Added http://localhost:3000/__diag to validate:

REST host (should be api.fecro.ae)

Read checks for rfqs, products, rfq_events, quotations

"Seed 2 demo RFQs" helper

If a read fails: check env, CORS (Worker), or RLS policies.

Database (Supabase)

Tables: rfqs (current RFQ state), quotations (seller quotes), rfq_events (append-only audit), products.

Triggers auto-update updated_at.

Dev-open RLS for all tables (reads/writes allowed during MVP). Tighten later.

rfqs vs rfq_events:

rfqs: one row per RFQ (source of truth for lists/UI)

rfq_events: history of actions (create|update|delete|view) with optional JSON payload

quotations: seller responses to RFQs with pricing and terms

Services & Hooks (single data boundary)

RFQ backend: /src/services/backends/supabase.js (CRUD + logEvent) re-exported via /src/services/backends/__active.js.
UI never imports @supabase/supabase-js directly.

RFQ hook: /src/hooks/useRFQ.js (list + CRUD state with user filtering).

Quotations: /src/services/quotationsService.js + /src/hooks/useSubmitQuotation.js; 
UI in /src/components/QuotationForm.jsx and /src/components/SellerQuotationsTab.jsx.

Products: /src/services/productsService.js + /src/hooks/useProducts.js; UI in /src/components/SavedProductsTab.jsx.

ID helpers: /src/services/ids.js & /src/services/rfqService.js (ESLint-safe; no self/globalThis).
Use makeUUID() + ensureUniquePublicId() for { id, publicId }.

UI/UX Behaviors

Post Request form: required title, description. Cancel resets to INITIAL_NEW_REQUEST.

Status badge map: active→Open, paused→Draft, closed→Closed, else→Inactive.

Components remain thin (Tailwind-only, lucide-react).

User Privacy: RFQs filtered by user_id so users only see their own requests.

Known Gotchas / Runbook

CRA envs must be REACT_APP_* and CRA must be restarted after edits.

No trailing slash in REACT_APP_SUPABASE_URL.

If Buyer list doesn't refresh after create: ensure hooks call await load() after createRFQ.

If users see each other's RFQs: check AuthContext generates unique user IDs and 
useRFQ passes user_id filter to listRFQs().

If quotation count doesn't update: verify quotationsService increments RFQ.quotations after createQuotation.

If a CORS error names a header (e.g., x-client-info), Worker reflects requested headers; extend allowlist if you add custom headers.

If any keys were shared during debugging, rotate anon key (Supabase → Settings → API) and update.

Multiple GoTrueClient warning: add singleton pattern to supabase.js client creation.

Next Steps

Tighten RLS: remove dev-open policies; add owner-based policies once Auth is enabled.

Admin Console: simple page to browse rfq_events per RFQ.

Products: finish create/edit/delete + search (trigram index is ready).

Quotation Management: add buyer interface to view/accept/reject quotations.

Real Authentication: replace demo AuthContext with Supabase Auth or similar.

CORS allowlist: add final production UI origin(s) to Worker.

Monitoring: enable Worker logs/analytics and review Supabase logs.

*/