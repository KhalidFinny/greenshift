# Technical Documentation

Engineering documentation for GreenShift: architecture, API, data model, security, and data-access
conventions.

## 1. Architecture overview

GreenShift is a **role-based microfrontend** organized as a Bun workspace monorepo that compiles into **one
Cloudflare Worker**: one build, one deploy, one API, one database.

```
Browser
  |
Cloudflare Worker (src/server.ts)
  |-- /api/*        -> Hono app (apps/api)
  |-- everything else -> TanStack Start SSR (src/routes)
  |
Bindings: D1 (DB) | KV (KV) | R2 (R2) | Workers AI (AI)
```

The Worker entry (`src/server.ts`) routes by pathname: `/api` and `/api/*` go to the Hono application,
everything else to the TanStack Start handler. Security headers are applied to every response.

## 2. Monorepo and package boundaries

```
apps/
  api/            Backend: Hono API, Drizzle schema, sessions (no React, no design)
packages/
  ui/             Design system: shadcn components, Header/Footer, RoleShell, charts, cn
  core/           Shared frontend contract: useAuth, guards, role nav/home, typed API client
  landing/        Landing page
  business/       Business dashboard (wizard, projects, matchmaking, procurement)
  vendor/         Vendor dashboard
  broker/         Broker dashboard
  admin/          Admin dashboard
  investor/       Public bond catalog
src/              Web app: TanStack Start routes, router, Worker entry
docs/             Role specifications, ADRs, glossary
scripts/          Demo accounts (accounts.ts) and the seed-fixture generator (seed.ts)
```

| Role | Entry route | Package | Data source |
|---|---|---|---|
| `business` | `/business` | `packages/business` | `/api/business/*` (own verification, submission wizard and drafts, projects, documents, risk, reading, forecast, matchmaking, procurement, notifications, profile). |
| `vendor` | `/vendor` | `packages/vendor` | `/api/vendor/*` (profile, opportunities, proposals, negotiations, notifications, leaderboard, portfolio, milestones, MRV reports). |
| `broker` | `/broker` | `packages/broker` | `/api/broker/*` (assigned projects, document requests, monthly reports with PDF export, notifications, profile). |
| `admin` | `/admin` | `packages/admin` | `/api/admin/*` plus `GET /api/health` for the binding-status card. Every figure the console renders comes from the API. |
| `investor` | `/bonds` | `packages/investor` | `GET /api/investor/market` (D1 only; the catalog renders an empty state when nothing is published). |

`roleHome` and `roleNav` in `packages/core/src/auth/index.ts` are the single source of truth for a role's home
route and sidebar; `requireRole` uses them for redirects. The same file holds `requireVerifiedCompany`, the
client-side mirror of the company gate described in § 5.

Import rules, enforced by convention and folder discipline:

- A role package imports **only** from `@greenshift/core`, `@greenshift/ui`, and `@tanstack/*`.
- A role package **never** imports another role package.
- The web app (`src/`) is the composition layer: route files mount role packages under guarded layouts.
- The backend (`apps/api`) imports nothing from the web app or role packages.

Why not Module Federation: federation splits builds and loads remote entries at runtime, which is pointless
for a single Worker bundle. The organizational benefits (isolated packages, few merge conflicts) come from the
import contract without the runtime cost.

## 2b. Backend module layout

`apps/api/src` is organised feature-first, with the route -> service -> repository split applied per feature:

```
apps/api/src/
  index.ts          app assembly: error/not-found handlers and the module mounts
  env.ts            Worker bindings (DB, KV, R2, AI)
  contracts.ts      the shared request/response contract the frontend imports
  db/               Drizzle instance and schema
  lib/              cross-cutting infrastructure: session, password, csrf, authz, rate-limit,
                    mutation-limit, http, document-upload, response, request-logger, annotations,
                    format, pdf
  modules/
    <module>/                 one module per surface: auth, account, business, vendor, broker,
                              admin, investor, health
      <module>.routes.ts      module router: shared middleware (session, role, CSRF) and feature mounts
      <module>.shared.ts      helpers used by more than one feature of the module
      <feature>/
        <feature>.routes.ts      controllers: validate the request, call the service/repository, shape the JSON
        <feature>.service.ts     business rules: state transitions, guards, orchestration, audit + notifications
        <feature>.repository.ts  all Drizzle access for the feature
```

A feature only gets a `.service.ts` when it holds rules beyond reading and shaping data: there are no
pass-through layers. Route handlers never query Drizzle directly, and repositories never touch Hono contexts.

## 3. Request lifecycle

1. `src/server.ts` receives the request and picks the API or SSR handler.
2. For SSR, the root route `beforeLoad` calls the `getSessionFn` server function, which reads the session
   cookie, resolves the session from KV and re-reads the user row from D1, so the role is never stale.
3. `context.user` is available to the router; guards (`requireRole`) redirect unauthenticated users to
   `/login` and wrong-role users to their role home.
4. Role layout routes (`src/routes/_auth.<role>.*`) render the matching package.
5. A business account that is not verified is sent to `/business/verification` instead, by
   `requireVerifiedCompany` in the business layout route (`src/routes/_auth.business.tsx`).

## 4. Authentication and authorization

- **Login** (`POST /api/auth/login`): D1 user lookup, PBKDF2 verification (100k iterations, with
  rehash-on-login when the stored iteration count is lower), then a 32-byte opaque token stored in KV under
  `greenshift:session:<token>`. 100k is the ceiling workerd accepts for PBKDF2 ("iteration counts above 100000
  are not supported"), so it is below the 600k the OWASP Password Storage Cheat Sheet asks for; a hash stored
  above that ceiling is treated as invalid rather than throwing.
- **Cookie**: `__Host-greenshift_session`, `HttpOnly`, `Secure`, `SameSite=Lax`, with a cookie max-age that
  matches the absolute session cap.
- **Session policy**: KV TTL plus an idle timeout (default 15 minutes, `SESSION_IDLE_MINUTES` override) and
  an absolute cap (8 hours). The role is re-resolved from D1 on each request, so demotion or deletion takes
  effect immediately.
- **Authorization**: role checks run at the API layer (`requireSession`, `requireRole`) and are mirrored in
  the router. The frontend hides what the backend forbids.
- **Step-up**: sensitive admin mutations require a recent re-authentication and return `428 STEP_UP_REQUIRED`
  when it is missing.

## 5. Account verification

Account gates sit in front of the work, and they work differently.

**Company: self-verifying.** A `business` account files a pack and the platform reads it.

- The details it confirms go through `PUT /api/business/verification`, together with its legal identity: NIB
  and NPWP.
- Two certificates, one file per slot: `akta` (Deed of incorporation, Akta Pendirian) and `siup` (Trading
  licence), defined by `companyDocumentSlots` and `companyDocumentLabels` in `apps/api/src/contracts.ts`.
  Files are PDF, PNG, JPG or WebP, 10 MB at most, stored in R2.
- `POST /api/business/verification/submit` refuses while anything is missing, then scans every filed
  certificate (`apps/api/src/modules/business/verification/document-scan.service.ts`). `AI.toMarkdown`
  converts the file to text and an instruct model reports the document type, the company name and the
  registration number the document states. The model only reads: the comparison against the account's own
  name, NIB and NPWP happens in code, so every verdict traces back to words the document contains.
- Outcomes: every certificate reads and matches, so the account verifies itself; a mismatch rejects the filing
  with the reading; an unreadable file asks for a clearer scan, three attempts, then the account goes to an
  administrator. An administrator can also verify or revoke by hand, and reads the filed files through
  `GET /api/admin/users/:id/verification` and `GET /api/admin/users/:id/verification/documents/:slot`.

`requireVerifiedCompany` in `apps/api/src/lib/authz.ts` answers `403 COMPANY_NOT_VERIFIED` for every business
endpoint mounted after it, and `business.routes.ts` mounts `verificationRoutes` before the gate, so the
verification step is the only work an unverified company can do. The router mirrors the gate in
`src/routes/_auth.business.tsx`.

**Vendor: reviewed by an administrator.** A vendor files its legal identity (NIB, NPWP, TDP) and one industry
certificate, an ESCO licence or an ISO energy-management certificate (`vendorCertificateLabel` in
`contracts.ts`), held on the vendor profile with the scan's reading. The scan runs on upload and only reads the
document; the verdict stays with the administrator. The certificate endpoints are declared in
`apiRoutes` as `vendorCertificate` and `vendorCertificateFile` and implemented in
`apps/api/src/modules/vendor/profile/certificate.service.ts`. An administrator verifies the profile with
`PATCH /api/admin/vendors/:id/verify`, which refuses to verify until the pack is on file (NPWP, TDP, at least
one certification entry and the certificate file) and records a rejection reason. Until then the vendor can
browse but `POST /api/vendor/proposals` and the proposal update endpoints answer `403 VERIFICATION_REQUIRED`.

**Broker: reviewed by an administrator.** The broker has the same shape as the vendor: profile and
notifications stay reachable while verification is pending, and everything else goes through
`requireVerifiedBroker` in `apps/api/src/modules/broker/broker.shared.ts`.

## 6. Security

- **CSRF**: unsafe methods on authenticated routes require a same-origin `Origin`/`Referer`/`sec-fetch-site`
  and an `x-csrf-token` header equal to the session's CSRF token.
- **Rate limiting**: fixed-window KV counters per IP and per user on auth and mutation routes; `429` includes
  `Retry-After`.
- **Input validation**: JSON-only bodies capped at 16 KB, exact media-type checks, length caps and typed
  validation per route; errors are returned in a consistent shape.
- **Security headers** on every response: CSP, HSTS (production), `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- **Error handling**: a central `app.onError` and a last-resort Worker boundary log details server-side and
  return sanitized 500s.

## 7. HTTP API reference

Base path `/api`. All responses are JSON.

**Error shape**

```json
{ "error": { "code": "NOT_FOUND", "message": "Project not found" } }
```

**Status codes**: `400` validation, `401` unauthenticated, `403` forbidden/CSRF, `404` not found, `409`
conflict/invalid state, `413` payload too large, `415` unsupported media type, `422` business rule, `428`
step-up required, `429` rate limited, `500` internal.

**Pagination**: list endpoints accept `?limit=` (1 to 200, default 50).

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | none | Read-only D1/KV/R2 probes. |

### Auth

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | Verify credentials, create session, set cookie. |
| POST | `/api/auth/register` | `{ accountType, name, email, password, phone, organizationName, industry, address, businessInfo?, nib?, npwp? }` | Register the person and the organization they represent. `accountType` is `company` (role `business`) or `vendor`; a vendor account is written with its `vendor_profiles` row in the same batch, unverified until an admin verifies it. |
| GET | `/api/auth/me` | none | Current user. |
| GET | `/api/auth/csrf` | none | CSRF token and step-up expiry. |
| POST | `/api/auth/step-up` | `{ password }` | Re-authenticate for sensitive actions. |
| POST | `/api/auth/logout` | none | Destroy session, clear cookie. |

### Account (any signed-in role)

| Method | Path | Description |
|---|---|---|
| GET | `/api/account/avatar` | The account's profile picture, streamed from R2. |
| PUT | `/api/account/avatar` | Upload or replace the picture (multipart field `avatar`). |
| DELETE | `/api/account/avatar` | Remove the picture and its R2 object. |

### Public bonds

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/investor/market` | none | Bond catalog: `{ bonds: BondListing[] }`. |

### Business (role `business`)

The verification endpoints come first: they are mounted before `requireVerifiedCompany`, so an unverified
account can file its pack (see § 5).

| Method | Path | Description |
|---|---|---|
| GET | `/api/business/verification` | The account's verification: status, details, identity, both certificate slots, what is missing, scans left. |
| PUT | `/api/business/verification` | Save the details the company confirms (name, sector, address, representative, phone, NIB, NPWP). |
| POST | `/api/business/verification/documents/:slot` | File one certificate (`akta` or `siup`; multipart, 10 MB, PDF/PNG/JPG/WebP, stored in R2). |
| GET | `/api/business/verification/documents/:slot` | Read a filed certificate back. |
| DELETE | `/api/business/verification/documents/:slot` | Remove a filed certificate. |
| POST | `/api/business/verification/submit` | File the pack for review; runs the document scan and decides the verdict. |
| PUT | `/api/business/drafts/:draftId` | Save one wizard step of a draft. |
| GET | `/api/business/drafts/:draftId` | Resume a draft. |
| POST | `/api/business/drafts/:draftId/documents` | Attach a draft document (multipart). |
| DELETE | `/api/business/drafts/:draftId/documents/:docId` | Remove a draft document. |
| POST | `/api/business/projects/submit` | Consume the draft, score the project and create it. |
| GET | `/api/business/projects` | The company's projects with their status pill. |
| GET | `/api/business/projects/:id` | One project as the review step showed it, plus the blueprint it became. |
| GET | `/api/business/projects/:id/risk` | Stored risk assessment. |
| GET | `/api/business/projects/:id/registry` | What the environmental registry answers about the project. |
| POST | `/api/business/projects/:id/lvv` | Mark the project registered at Sistem Registri with an LVV body appointed. |
| GET | `/api/business/projects/:id/blueprint` | The Green Project Blueprint, or null while there is none. |
| GET | `/api/business/projects/:id/documents` | The project's documents. |
| GET | `/api/business/projects/:id/documents/:docId/download` | One project document. |
| GET | `/api/business/profile` | Company profile. |
| PUT | `/api/business/profile` | Save the company profile. |
| GET | `/api/business/matchmaking` | Projects waiting on a vendor choice. |
| GET | `/api/business/matchmaking/:projectId` | One project's ranking and match factors. |
| POST | `/api/business/matchmaking/:projectId/matching` | Re-run the scoring model. |
| POST | `/api/business/matchmaking/:projectId/selection` | Record the chosen vendor. |
| PATCH | `/api/business/procurement/:projectId/tender` | Close bidding (`action: close`); the bids move to evaluation. |
| POST | `/api/business/procurement/:projectId/award` | Award a bid. |
| POST | `/api/business/procurement/:projectId/proposals/:proposalId/review` | Ask for a revision or reject a bid (`decision: revision` or `reject`); accepting is the award endpoint. |
| GET | `/api/business/procurement/:projectId/proposals/:proposalId/document` | The bid's PDF. |
| POST | `/api/business/review/reading` | The risk assessment read back in prose. |
| POST | `/api/business/review/forecast` | ROI scenarios for the wizard's review step. |
| POST | `/api/business/review/forecast/reading` | The forecast read back in prose. |
| POST | `/api/business/risk/insight` | On-demand risk narrative. |
| GET | `/api/business/notifications` | Notification feed. |
| PATCH | `/api/business/notifications/:id` | Mark one notification read. |
| PATCH | `/api/business/notifications` | Mark the whole feed read. |

### Vendor (role `vendor`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/vendor/projects` | Biddable tenders/projects. |
| GET | `/api/vendor/projects/:id` | Project detail (blueprint financials once published). |
| GET | `/api/vendor/my-projects` | Projects the vendor has a proposal on, with delivery milestones and MRV reports. |
| GET | `/api/vendor/my-projects/:id` | Own-proposal project detail. |
| GET | `/api/vendor/procurement-status` | Procurement status with latest revision note. |
| GET | `/api/vendor/profile` | Vendor profile. |
| PUT | `/api/vendor/profile` | Atomic upsert of the vendor profile; `companyName` is required, every other field is written only when the body carries it (`serviceCategory`, `location`, `nib`, `npwp`, `tdp`, `description`, `certifications`, `portfolio`). |
| POST | `/api/vendor/profile/certificate` | File the industry certificate (ESCO licence or ISO energy management; multipart, 10 MB, PDF/PNG/JPG/WebP, stored in R2). |
| GET | `/api/vendor/profile/certificate` | The filed certificate, served inline. |
| GET | `/api/vendor/proposals` | Own proposals. |
| POST | `/api/vendor/proposals` | Submit a proposal to an open tender (multipart: the bid row is written with its PDF or not at all). |
| GET | `/api/vendor/proposals/:id` | Proposal detail with revision trail. |
| PATCH | `/api/vendor/proposals/:id` | Edit a submitted proposal, answer a revision, or revise an open bid. |
| DELETE | `/api/vendor/proposals/:id` | Withdraw a still-`submitted` proposal. |
| POST | `/api/vendor/proposals/:id/document` | File or replace the proposal PDF (multipart). |
| GET | `/api/vendor/proposals/:id/document` | The proposal PDF. |
| GET | `/api/vendor/negotiations` | Revision rounds the company opened on the vendor's proposals. |
| POST | `/api/vendor/negotiations/:id/response` | Answer a revision round (counter-offer, proposal revision trail, back to review). |
| GET | `/api/vendor/notifications` | Notification feed. |
| PATCH | `/api/vendor/notifications/:id` | Mark one notification read (idempotent). |
| PATCH | `/api/vendor/notifications` | Mark the whole feed read. |
| GET | `/api/vendor/leaderboard` | Ranking of one open tender: `?tenderId=` names the tender a project screen is showing, and without it the ranking is the vendor's own live open bidding. Closed and direct tenders answer empty (their offers are sealed). |
| GET | `/api/vendor/portfolio` | Portfolio references the vendor authored, each with the URL of its filed document. |
| POST | `/api/vendor/portfolio` | Add a portfolio reference. |
| POST | `/api/vendor/portfolio/:id/document` | File the supporting document on a reference (multipart, 10 MB, PDF/Word/PNG/JPG/WebP; stored in R2). |
| GET | `/api/vendor/portfolio/:id/document` | The filed document, served inline. |
| DELETE | `/api/vendor/portfolio/:id` | Remove a portfolio reference, and its filed document with it. |
| POST | `/api/vendor/milestones/:id/evidence` | Attach delivery evidence to a milestone of an awarded project. |

### Broker (role `broker`)

Assigned projects, document requests and reports require a verified broker profile (`requireVerifiedBroker`);
profile and notification endpoints stay reachable while verification is pending.

| Method | Path | Description |
|---|---|---|
| GET | `/api/broker/profile` | Firm profile plus derived verification status; creates the profile on first read. |
| PUT | `/api/broker/profile` | Save the firm profile; filing licence data records a verification submission. |
| GET | `/api/broker/projects` | Assigned projects with parties, contract value, LVV GRK status, risk assessment, bond tracking, project documents, delivery milestones and open request count. |
| POST | `/api/broker/projects/:id/response` | Accept, request information about, or decline an assignment (a decline requires a reason). |
| PATCH | `/api/broker/projects/:id/status` | Move the broker lifecycle (see the lifecycles in § 8); illegal transitions return `409`. |
| PATCH | `/api/broker/projects/:id/bond` | Track the external bond (status, serial, amount, tenor, coupon, dates). |
| GET | `/api/broker/document-requests` | Document requests raised against assigned projects. |
| POST | `/api/broker/document-requests` | Request a document from the company (free-form type, period, reason, deadline). |
| PATCH | `/api/broker/document-requests/:id` | `START_REVIEW`, `APPROVE`, or `REJECT` (a rejection requires a reason). |
| GET | `/api/broker/reports` | Monthly monitoring reports for assigned projects. |
| GET | `/api/broker/reports/:id` | One composed report. |
| GET | `/api/broker/reports/:id/pdf` | The report as a generated PDF (`application/pdf`, attachment). |
| GET | `/api/broker/notifications` | Notification feed. |
| PATCH | `/api/broker/notifications/:id` | Mark one notification read (idempotent). |
| PATCH | `/api/broker/notifications` | Mark the whole feed read. |

Each report is composed from source data rather than stored prose: progress from `project_milestones`, energy
and carbon from the period's `emission_reports` row, and the official figures the company published in
`emission_reports.report_data`. Fields with no source stay at `0` instead of being estimated. The PDF is
written by `apps/api/src/lib/pdf.ts`, a dependency-free PDF 1.4 generator, because Workers cannot run the
usual PDF libraries.

### Admin (role `admin`, step-up for mutations)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/users` | Users with role/verification info. |
| PATCH | `/api/admin/users/:id/verify` | Verify or unverify a user. |
| GET | `/api/admin/users/:id/verification` | One account's company verification, as the reviewer reads it. |
| GET | `/api/admin/users/:id/verification/documents/:slot` | A certificate the account filed. |
| GET | `/api/admin/projects` | Projects with company and blueprint status. |
| PATCH | `/api/admin/projects/:id/status` | Advance the project lifecycle. |
| GET | `/api/admin/blueprints` | Blueprints with project titles. |
| PATCH | `/api/admin/blueprints/:id` | Advance the blueprint lifecycle. |
| GET | `/api/admin/investments` | Investments with investor and project. |
| GET | `/api/admin/roi-payments` | ROI payment schedule. |
| POST | `/api/admin/roi-payments/:id/payout` | Mark a scheduled payment paid (sandbox escrow). |
| GET | `/api/admin/audit-logs` | Audit trail. |
| GET | `/api/admin/stats` | Dashboard aggregates. |
| GET | `/api/admin/analytics` | Trailing 12 months of accounts, organizations, projects, investments, ROI paid and MRV carbon reduction, plus platform totals and the summed project carbon target. |
| GET | `/api/admin/anomalies` | Read-only red-flag rule engine. |
| GET | `/api/admin/vendors` | Vendor profiles. |
| PATCH | `/api/admin/vendors/:id/verify` | Verify or reject a vendor profile. Verifying requires the filed pack (NPWP, TDP, at least one certification entry and the certificate file); a rejection carries a reason. |
| GET | `/api/admin/vendors/:id/certificate` | The industry certificate the vendor filed, as the reviewer reads it. |
| GET | `/api/admin/brokers` | Broker profiles with licence filing and verification state. |
| PATCH | `/api/admin/brokers/:id/verify` | Verify or reject a broker profile (a rejection requires a reason). |

Request and response types live in `apps/api/src/contracts.ts` and are re-exported to the frontend through
`@greenshift/api`, so client and server share one typed contract. `apiRoutes` in the same file is the single
list of method/path pairs the frontend client calls.

Every surface reads the API: the admin console uses `/api/admin/*` plus `GET /api/health` for its binding
card, and the bond catalog, the company dashboard, the vendor dashboard and the broker dashboard all fetch
from their own module. The vendor and broker UIs keep only client-side UI state locally. The vendor
performance tiles are derived from awarded projects, milestones, MRV reports and the platform rating; fields
the API does not store, such as client endorsements, stay at 0 rather than being estimated. The broker's
bond-preparation checklist mirrors `/api/broker/projects/:id/status` transitions, so the UI cannot move a
project into a state the API rejects.

## 8. Data model

D1 is the source of truth. The schema is defined with Drizzle in `apps/api/src/db/schema.ts` and versioned as
SQL migrations in `drizzle/`. The schema is also the source of the shared types.

**Conventions**

- Primary keys are `integer PRIMARY KEY AUTOINCREMENT`.
- Timestamps are epoch **milliseconds** (`integer(... { mode: "timestamp_ms" })`).
- `createdAt` uses `$defaultFn`, and `updatedAt` also uses `$onUpdateFn` so writes bump it automatically.
- Enums are `text` columns with a TypeScript union (no SQL `CHECK`).
- JSON columns use `text({ mode: "json" }).$type<T>()`.
- Foreign keys are declared at the DB level with `onDelete` actions.

**Tables**

| Table | Purpose |
|---|---|
| `users` | Accounts for the five roles (`business`, `investor`, `vendor`, `admin`, `broker`), with a company account's legal identity (NIB, NPWP) and verification state. |
| `company_documents` | The certificates a company files for verification: one row per slot, holding the R2 key and the scan's reading. |
| `vendor_profiles` | Vendor company profile, one per vendor user, with its legal identity and the industry certificate it filed. |
| `projects` | Business projects with parameters, risk result, lifecycle status. |
| `drafts` | The submission wizard's saved state, one per company. |
| `draft_documents` | Files attached to a draft, before the project exists. |
| `project_documents` | Uploaded documents and OCR status. |
| `risk_assessments` | Financial/technical/implementation scores. |
| `vendor_match_scores` | Weighted vendor matching scores per project. |
| `vendor_assignments` | The matchmaking choice that opens a tender to one vendor. |
| `tenders` | Procurement round for a project. |
| `proposals` | Vendor bids for a tender. |
| `proposal_revisions` | Revision trail for a proposal. |
| `blueprints` | Green Project Blueprint and audit lifecycle. |
| `energy_forecasts` | Forecasted consumption/savings with model metrics. |
| `investments` | Investor positions per project. |
| `roi_payments` | Scheduled/paid ROI payments (sandbox escrow). |
| `emission_reports` | MRV reports with anomaly flag/score. |
| `audit_logs` | Traceability trail for every mutation. |
| `notifications` | Per-user notifications. |
| `negotiations` | Company revision rounds over a proposal (requested terms, vendor counter-offer, status, and the marks the company drew on the proposal). |
| `project_milestones` | Delivery milestones of an awarded project. |
| `milestone_evidence` | Files a vendor attaches to a milestone. |
| `vendor_portfolio_items` | Portfolio references a vendor authored, with the R2 key of the supporting document. |
| `broker_profiles` | Broker firm profile, licence filing and verification state, one per broker user. |
| `broker_assignments` | Company-to-broker assignment: broker lifecycle status, assignment decision, bond tracking. |
| `document_requests` | Broker document requests to the company, with submission and review state. |

**Lifecycles**

- Project: `draft -> registry -> assessment -> tendering -> blueprint -> funding -> monitoring -> completed`.
  `registry` is the company's own move: the project is on record and waiting to be registered at the
  environmental registry with an LVV body appointed (`POST /api/business/projects/:id/lvv`, which is what
  advances it to `assessment`). Verification answers out of band and clears the project into `tendering`, where
  the Green Project Blueprint is generated and matchmaking opens.
- Blueprint: `draft -> audit -> validated | rejected -> published`
- Proposal: `submitted -> reviewed -> revision -> accepted | rejected`
- Tender: `open -> evaluation -> closed -> awarded`
- Broker assignment: `ASSIGNED -> DOCUMENT_COLLECTION <-> UNDER_REVIEW -> READY_FOR_BOND_ISSUANCE -> BOND_ISSUANCE -> MONITORING -> COMPLETED` (plus `DECLINED`); forward steps only, with a one-step correction
- Document request: `REQUESTED -> SUBMITTED -> UNDER_REVIEW -> APPROVED | REJECTED -> RESUBMISSION`
- External bond: `NOT_STARTED -> IN_PROGRESS -> ISSUED` (tracked only; issuance happens outside GreenShift)
- Company verification: `NOT_VERIFIED -> NEEDS_RESCAN -> PENDING -> VERIFIED | REJECTED`. `NEEDS_RESCAN` is
  the scan asking for a clearer file; after three attempts the account goes to `PENDING`, where an
  administrator decides. `REJECTED` carries the reading that caused it.

**Unique constraints** (enforced in the database, and what make the `ON CONFLICT` upserts atomic):

| Index | Guarantees |
|---|---|
| `users_email_unique` | One account per email. |
| `company_documents_user_slot_unique` | One file per certificate slot per account. |
| `vendor_profiles_user_id_unique` | One vendor profile per user. |
| `proposals_tender_vendor_unique` | One proposal per vendor per tender. |
| `proposal_revisions_proposal_number_unique` | One row per revision number. |
| `negotiations_proposal_iteration_unique` | One revision round per proposal and iteration. |
| `project_milestones_project_step_unique` | One milestone per step of a project. |
| `vendor_assignments_project_unique` | One matchmaking choice per project. |
| `investments_bond_serial_unique` | Unique bond serial (nullable). |
| `roi_payments_escrow_tx_unique` | Unique escrow transaction id (nullable). |
| `broker_profiles_user_id_unique` | One broker profile per user. |
| `broker_assignments_project_broker_unique` | One assignment per project and broker. |

## 9. Data access (Drizzle only)

All application data access goes through the Drizzle instance (`createDb(env.DB)`). There are no direct D1
binding calls and no hand-written SQL statements. `sql` template fragments are used only where the query
builder cannot express a construct (atomic increments, `CASE` ordering, null-safe aggregate sums, correlated
subqueries) and every value is bound as a parameter.

Highlights:

- The vendor profile PUT is a single atomic `INSERT ... ON CONFLICT DO UPDATE` upsert on the unique `user_id`.
- Proposal submission is a single atomic `INSERT ... SELECT` with the open-tender/deadline guard inside the
  SELECT and `ON CONFLICT DO NOTHING` on `(tender_id, vendor_id)`.
- Multi-statement writes use `db.batch`, which is D1's transactional primitive (D1 does not support
  interactive transactions across separate statements).

## 10. Migrations and deployment

```bash
bun run db:generate                                       # generate a migration from schema changes
bunx wrangler d1 migrations apply greenshift-db --local   # apply locally
bunx wrangler d1 migrations apply greenshift-db --remote  # apply to production
```

`scripts/seed.ts` builds the whole fixture set (accounts, vendor fixtures, bond catalog, broker fixtures) and
prints it as SQL. `scripts/accounts.ts` is the single source of truth for the demo accounts and for each
company's name, sector and address. The generated file resets every table it owns before inserting, which
makes it re-runnable locally and destructive by design, so it is never pointed at a deployed database.
Migrations themselves are applied by Wrangler (`migrations_dir` in `wrangler.jsonc`) when the dev server
starts.

Migrations are generated by Drizzle Kit and should not be hand-edited. D1 ties each migration to an implicit
transaction and enforces foreign keys, so a migration that rebuilds a table with inbound foreign keys must use
`PRAGMA defer_foreign_keys = on` rather than Drizzle Kit's default `PRAGMA foreign_keys=OFF`. Before applying
new unique indexes to a populated database, check for duplicate rows first, or the index build will fail.

The Worker, D1, KV, R2 and Workers AI bindings are declared in `wrangler.jsonc`; `bun run deploy` builds and
deploys.

## 11. Quality gate

- `bun run typecheck` (tsc) and `bun run check` (Biome) are the gate for every change.
- The route tree is regenerated with `bun run generate-routes`.
- End-to-end checks exercise login, the company verification pack (on a deployed worker, where Workers AI
  runs), the vendor profile and proposal flows, the broker assignment and document review flows (including
  the PDF export), the admin stats and anomaly console, and the public bond catalog.

## 12. UI component conventions

The shared UI layer (`@greenshift/ui`) builds on the shadcn primitives and adds the components every page
uses:

- **`DataTable`** (`packages/ui/src/organisms/data-table.tsx`) - a generic TanStack Table wrapper over the
  shadcn table primitives. Pages pass a typed `ColumnDef<T>[]` and data. It provides column sorting (click a
  string header), optional global search (`searchPlaceholder`), row ids (`getRowId`), per-cell classes via
  column `meta`, and an empty state. No page hand-writes table rows anymore.
  **Every table pages**: `pageSize` defaults to 10 and the footer (rows-per-page, "Page X of Y", Previous /
  Next) renders itself while the rows exceed one page, so a table can never render an unbounded dataset whole.
- **Pagination for lists that are not tables** - `usePagedRows(rows)` plus `<PaginationBar/>`
  (`packages/ui/src/hooks/use-paged-rows.ts`, `packages/ui/src/molecules/pagination-bar.tsx`). A page that
  renders its own rows (card grids, feeds, document lists) passes the array it already has to the hook, renders
  `pageRows`, and puts the bar under them, so a list and a table page the same way. Fixed-length collections
  (a stage timeline, a legend, a definition list) are left unpaged on purpose.
- **Charts** (`packages/ui/src/organisms/charts/`) - visx-based, themed through the `--chart-*` tokens: `BarChart`
  with `Bar`/`BarXAxis`/`Grid`, `PieChart`, `RingChart`, and `LineChart`
  (`line-chart.tsx`) for projections, which plots one path per series with the
  y domain derived from the values it is given and an optional `reference` line.
- **Forms** (`packages/ui/src/molecules/form.tsx`) - a `createFormHook` bundle exposing `useAppForm`
  plus the field components `TextField`, `NumberField` (optional `prefix`/`unit`), `SelectField`,
  `TextareaField`, `CheckboxField`, and `PasswordField`, and the `SubmitButton`. Field components read the
  field from context, own their label, message and aria wiring, and render validation errors with
  `aria-invalid`/`role="alert"`; the submit button reflects `canSubmit` / `isSubmitting`. Login, register, the
  admin step-up dialog and the business submission wizard are built on it. The wizard keeps its rule messages
  in `packages/business/src/lib/validators.ts` and reaches them through
  `packages/business/src/lib/wizard-rules.ts` only.

Design-system rules still apply: use the shared components as-is, keep text at the system
sizes, use the design tokens, and never import one role package from another.

