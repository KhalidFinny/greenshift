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
Bindings: D1 (DB) | KV (KV) | R2 (R2)
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
  business/       Business dashboard (placeholder — no API surface yet)
  vendor/         Vendor dashboard
  broker/         Broker dashboard
  admin/          Admin dashboard
  investor/       Public bond catalog
src/              Web app: TanStack Start routes, router, Worker entry
docs/             Role specifications (broker, vendor)
scripts/          Demo-user seeder (db:setup) and seed-fixture generator
```

| Role | Entry route | Package | Data source |
|---|---|---|---|
| `business` | `/business` | `packages/business` | Placeholder shell; no API surface yet. |
| `vendor` | `/vendor` | `packages/vendor` | `/api/vendor/*` (profile, opportunities, proposals, negotiations, notifications, leaderboard, portfolio, milestones, MRV reports). |
| `broker` | `/broker` | `packages/broker` | Local demo dataset (`packages/broker/src/lib/demo-data.ts`); no API surface yet. |
| `admin` | `/admin` | `packages/admin` | `/api/admin/*` plus static demo constants for the chart/console tiles. |
| `investor` | `/bonds` | `packages/investor` | `GET /api/investor/market`, falling back to the demo catalog when the API returns nothing. |

`roleHome` and `roleNav` in `packages/core/src/auth/index.ts` are the single source of truth for a role's home
route and sidebar; `requireRole` uses them for redirects.

Import rules, enforced by convention and folder discipline:

- A role package imports **only** from `@greenshift/core`, `@greenshift/ui`, and `@tanstack/*`.
- A role package **never** imports another role package.
- The web app (`src/`) is the composition layer: route files mount role packages under guarded layouts.
- The backend (`apps/api`) imports nothing from the web app or role packages.

Why not Module Federation: federation splits builds and loads remote entries at runtime, which is pointless
for a single Worker bundle. The organizational benefits (isolated packages, few merge conflicts) come from the
import contract without the runtime cost.

## 3. Request lifecycle

1. `src/server.ts` receives the request and picks the API or SSR handler.
2. For SSR, the root route `beforeLoad` calls the `getSessionFn` server function, which reads the session
   cookie and resolves the user from KV with a fresh D1 lookup of the role.
3. `context.user` is available to the router; guards (`requireRole`) redirect unauthenticated users to
   `/login` and wrong-role users to their role home.
4. Role layout routes (`src/routes/_auth.<role>.*`) render the matching package.

## 4. Authentication and authorization

- **Login** (`POST /api/auth/login`): D1 user lookup, PBKDF2 verification (600k iterations, with
  rehash-on-login when the stored iteration count is lower), then a 32-byte opaque token stored in KV under
  `greenshift:session:<token>`.
- **Cookie**: `__Host-greenshift_session`, `HttpOnly`, `Secure`, `SameSite=Lax`, with a cookie max-age that
  matches the absolute session cap.
- **Session policy**: KV TTL plus an idle timeout (default 15 minutes, `SESSION_IDLE_MINUTES` override) and
  an absolute cap (8 hours). The role is re-resolved from D1 on each request, so demotion or deletion takes
  effect immediately.
- **Authorization**: role checks run at the API layer (`requireSession`, `requireRole`) and are mirrored in
  the router. The frontend hides what the backend forbids.
- **Step-up**: sensitive admin mutations require a recent re-authentication and return `428 STEP_UP_REQUIRED`
  when it is missing.

## 5. Security

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

## 6. HTTP API reference

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
| POST | `/api/auth/register` | `{ name, email, password, companyName }` | Register a business account. |
| GET | `/api/auth/me` | none | Current user. |
| GET | `/api/auth/csrf` | none | CSRF token and step-up expiry. |
| POST | `/api/auth/step-up` | `{ password }` | Re-authenticate for sensitive actions. |
| POST | `/api/auth/logout` | none | Destroy session, clear cookie. |

### Public bonds

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/investor/market` | none | Bond catalog: `{ bonds: BondListing[] }`. |

### Vendor (role `vendor`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/vendor/projects` | Biddable tenders/projects. |
| GET | `/api/vendor/projects/:id` | Project detail (blueprint financials once published). |
| GET | `/api/vendor/my-projects` | Projects the vendor has a proposal on, with delivery milestones and MRV reports. |
| GET | `/api/vendor/my-projects/:id` | Own-proposal project detail. |
| GET | `/api/vendor/procurement-status` | Procurement status with latest revision note. |
| GET | `/api/vendor/profile` | Vendor profile. |
| PUT | `/api/vendor/profile` | Atomic upsert of the vendor profile. |
| GET | `/api/vendor/proposals` | Own proposals. |
| POST | `/api/vendor/proposals` | Submit a proposal to an open tender. |
| GET | `/api/vendor/proposals/:id` | Proposal detail with revision trail. |
| PATCH | `/api/vendor/proposals/:id` | Edit a submitted proposal, answer a revision, or revise an open bid. |
| DELETE | `/api/vendor/proposals/:id` | Withdraw a still-`submitted` proposal. |
| GET | `/api/vendor/negotiations` | Revision rounds the company opened on the vendor's proposals. |
| POST | `/api/vendor/negotiations/:id/response` | Answer a revision round (counter-offer, proposal revision trail, back to review). |
| GET | `/api/vendor/notifications` | Notification feed. |
| PATCH | `/api/vendor/notifications/:id` | Mark one notification read (idempotent). |
| GET | `/api/vendor/leaderboard` | Ranking of the open-bid tender the vendor is currently bidding on. |
| GET | `/api/vendor/portfolio` | Portfolio references the vendor authored. |
| POST | `/api/vendor/portfolio` | Add a portfolio reference. |
| DELETE | `/api/vendor/portfolio/:id` | Remove a portfolio reference. |
| POST | `/api/vendor/milestones/:id/evidence` | Attach delivery evidence to a milestone of an awarded project. |

### Admin (role `admin`, step-up for mutations)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/users` | Users with role/verification info. |
| PATCH | `/api/admin/users/:id/verify` | Verify or unverify a user. |
| GET | `/api/admin/projects` | Projects with company and blueprint status. |
| PATCH | `/api/admin/projects/:id/status` | Advance the project lifecycle. |
| GET | `/api/admin/blueprints` | Blueprints with project titles. |
| PATCH | `/api/admin/blueprints/:id` | Advance the blueprint lifecycle. |
| GET | `/api/admin/investments` | Investments with investor and project. |
| GET | `/api/admin/roi-payments` | ROI payment schedule. |
| POST | `/api/admin/roi-payments/:id/payout` | Mark a scheduled payment paid (sandbox escrow). |
| GET | `/api/admin/audit-logs` | Audit trail. |
| GET | `/api/admin/stats` | Dashboard aggregates. |
| GET | `/api/admin/anomalies` | Read-only red-flag rule engine. |
| GET | `/api/admin/vendors` | Vendor profiles. |
| PATCH | `/api/admin/vendors/:id/verify` | Verify or unverify a vendor profile. |

Request and response types live in `apps/api/src/contracts.ts` and are re-exported to the frontend through
`@greenshift/api`, so client and server share one typed contract. `apiRoutes` in the same file is the single
list of method/path pairs the frontend client calls.

Not every view is API-backed yet: the broker dashboard renders entirely from
`packages/broker/src/lib/demo-data.ts` and has no endpoints, and the bond catalog falls back to
`packages/investor/src/lib/demo-data.ts` when `GET /api/investor/market` returns an empty catalog. The vendor
and admin dashboards read from the API; the vendor UI keeps only project bookmarks in local storage, and its
verification-document form has no backend field yet.

## 7. Data model

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
| `users` | Accounts for the five roles (`business`, `investor`, `vendor`, `admin`, `broker`). |
| `vendor_profiles` | Vendor company profile, one per vendor user. |
| `projects` | Business projects with parameters, risk result, lifecycle status. |
| `project_documents` | Uploaded documents and OCR status. |
| `risk_assessments` | Financial/technical/implementation scores. |
| `vendor_match_scores` | Weighted vendor matching scores per project. |
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
| `negotiations` | Company revision rounds over a proposal (requested terms, vendor counter-offer, status). |
| `project_milestones` | Delivery milestones of an awarded project. |
| `milestone_evidence` | Files a vendor attaches to a milestone. |
| `vendor_portfolio_items` | Portfolio references a vendor authored. |

**Lifecycles**

- Project: `draft -> assessment -> tendering -> blueprint -> funding -> monitoring -> completed`
- Blueprint: `draft -> audit -> validated | rejected -> published`
- Proposal: `submitted -> reviewed -> revision -> accepted | rejected`
- Tender: `open -> evaluation -> closed -> awarded`

**Unique constraints** (enforced in the database, and what make the `ON CONFLICT` upserts atomic):

| Index | Guarantees |
|---|---|
| `users_email_unique` | One account per email. |
| `vendor_profiles_user_id_unique` | One vendor profile per user. |
| `proposals_tender_vendor_unique` | One proposal per vendor per tender. |
| `proposal_revisions_proposal_number_unique` | One row per revision number. |
| `investments_bond_serial_unique` | Unique bond serial (nullable). |
| `roi_payments_escrow_tx_unique` | Unique escrow transaction id (nullable). |

## 8. Data access (Drizzle only)

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

## 9. Migrations and deployment

```bash
bun run db:generate                                       # generate a migration from schema changes
bunx wrangler d1 migrations apply greenshift-db --local   # apply locally
bun run db:setup                                          # seed the demo users into the local database
bunx wrangler d1 migrations apply greenshift-db --remote   # apply to production
```

`scripts/setup-db.ts` (wrapped by `bun run db:setup`) only inserts the demo users and skips the ones that
already exist, so it is safe to re-run. Migrations themselves are applied by Wrangler (`migrations_dir` in
`wrangler.jsonc`) when the dev server starts.

Migrations are generated by Drizzle Kit and should not be hand-edited. D1 ties each migration to an implicit
transaction and enforces foreign keys, so a migration that rebuilds a table with inbound foreign keys must use
`PRAGMA defer_foreign_keys = on` rather than Drizzle Kit's default `PRAGMA foreign_keys=OFF`. Before applying
new unique indexes to a populated database, check for duplicate rows first, or the index build will fail.

The Worker, D1, KV and R2 bindings are declared in `wrangler.jsonc`; `bun run deploy` builds and deploys.

## 10. Verification

- `bun run typecheck` (tsc) and `bun run check` (Biome) are the gate for every change.
- The route tree is regenerated with `bun run generate-routes`.
- Local end-to-end checks exercise login, the vendor profile/proposal flows, the admin stats and anomaly
  console, and the public bond catalog.

## 11. UI component conventions

The shared UI layer (`@greenshift/ui`) builds on the shadcn primitives and adds two TanStack-powered
components that every page uses:

- **`DataTable`** (`packages/ui/src/components/ui/data-table.tsx`) - a generic TanStack Table wrapper over the
  shadcn table primitives. Pages pass a typed `ColumnDef<T>[]` and data. It provides column sorting (click a
  string header), optional global search (`searchPlaceholder`), optional pagination (`pageSize`), row ids
  (`getRowId`), per-cell classes via column `meta`, and an empty state. No page hand-writes table rows anymore.
- **Forms** (`packages/ui/src/components/form/form.tsx`) - a `createFormHook` bundle exposing `useAppForm`
  plus `TextField`, `PasswordField`, and `SubmitButton`. Field components read the field from context, render
  validation errors with `aria-invalid`/`role="alert"`, and the submit button reflects `canSubmit` /
  `isSubmitting`. Login, register, and the admin step-up dialog are built on it.

Design-system rules (see `agent.md`) still apply: use the shared components as-is, keep text at the system
sizes, use the design tokens, and never import one role package from another.

