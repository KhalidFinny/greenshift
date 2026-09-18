# GreenShift

**MRV platform for green financing.** GreenShift validates industrial energy-efficiency projects, builds a
*Green Project Blueprint*, and connects projects to green funding through licensed SCF partners.

The application ships role-based dashboards for **business**, **vendor**, and **admin**, plus a public
**bond catalog**, all served from a single Cloudflare Worker.

## Documentation

| Document | Contents |
|---|---|
| [INSTALLATION.md](INSTALLATION.md) | Requirements, install, running, seeded accounts, database setup, build and deploy. |
| [TECH_STACK.md](TECH_STACK.md) | Technology stack and repository layout by technology. |
| [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) | Architecture, package boundaries, auth, security, HTTP API reference, data model, data-access conventions. |

## Features

| Surface | What it does |
|---|---|
| Landing (`/`) | Public marketing site: hero, how it works, ecosystem, FAQ, contact. |
| Bond catalog (`/bonds`) | Public catalog of verified bond listings. Bonds are sold via brokers, so there is no buy/portfolio flow. |
| Business dashboard | Create projects, submit them for assessment, review risk results, open tenders. |
| Vendor dashboard | Browse open tenders, submit proposals, respond to revision requests, track procurement status. |
| Admin console | Verify users/vendors, drive the project and blueprint lifecycle, pay out ROI, review the audit trail, and watch the anomaly/red-flag console. |

## Quick start

```bash
bun install
bun run dev
```

Open http://localhost:3000. Seeded logins (password `12345678`): `business1`, `vendor1`, `admin`.

See [INSTALLATION.md](INSTALLATION.md) for role-scoped dev servers, the database workflow and deployment.

## Repository layout

```
apps/api/        Backend: Hono API, Drizzle schema, auth/sessions
packages/ui/     Design system
packages/core/   Shared frontend contract
packages/landing/    Landing page
packages/business/   Business dashboard
packages/vendor/     Vendor dashboard
packages/admin/      Admin dashboard
packages/investor/   Public bond catalog
src/             Web app: TanStack Start routes, router, Worker entry
scripts/         Seed data generator
drizzle/         D1 migrations
```

## Quality checks

```bash
bun run typecheck   # tsc --noEmit
bun run check       # biome check
```
