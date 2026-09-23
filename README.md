# GreenShift

**MRV platform for green financing in Indonesia.** A company submits an industrial energy-efficiency
project, GreenShift scores it, the company matches it with a vendor, and the verified project becomes a
Green Project Blueprint that a licensed securities partner funds. Everything runs as one Cloudflare Worker:
one build, one deploy, one API, one D1 database.

## Surfaces

| Surface | Route | Who | What it does |
|---|---|---|---|
| Landing | `/` | public | Product site: hero, how it works, ecosystem, FAQ, contact. |
| Bond catalog | `/bonds` | public | Verified projects offered as bonds (`GET /api/investor/market`). The buy button opens a partner securities app (Trima+, with IPOT as the alternative); GreenShift issues, settles and pays nothing itself. |
| Company dashboard | `/business` | role `business` | Verification pack, project submission wizard, project records, vendor matchmaking, tender and award. |
| Vendor dashboard | `/vendor` | role `vendor` | Open tenders, proposals and revision rounds, active projects and milestones, portfolio, profile. |
| Broker dashboard | `/broker` | role `broker` | Assigned projects, company document requests, monthly monitoring reports with PDF export. |
| Admin console | `/admin` | role `admin` | Account and vendor verification, project and blueprint lifecycle, ROI payouts, analytics, anomaly console, audit trail. |

Account gates sit in front of the work. A company files its pack (details, NIB and NPWP, deed of
incorporation, trading licence) and the document scan accepts or rejects it; until then every other `/business`
screen redirects to the verification step. A vendor files NIB, NPWP, TDP and an ESCO or ISO certificate, and an
administrator verifies the profile before the vendor can bid. A broker profile must be verified too before it
can receive assignments.

## Quick start

```bash
bun install
bun run dev     # http://localhost:3000
```

The dev server creates the local D1 database on its first start. In another shell, apply the migrations and
load the demo fixtures:

```bash
bunx wrangler d1 migrations apply greenshift-db --local
bunx tsx scripts/seed.ts > scripts/seed.sql
bunx wrangler d1 execute greenshift-db --local --file=scripts/seed.sql
```

The seed is destructive: it resets every table it owns before inserting. Never point it at a deployed
database.

Seeded logins, password `12345678` (the login form takes the username or the full email). The deployed site
at `https://greenshift.fiinnyy.my.id` carries the same accounts.

| Username | Role | Use it to test |
|---|---|---|
| `business1` … `business10` | company | Wizard, matchmaking, tenders, awards. Each company runs one open and one awarded round. |
| `vendor1` … `vendor10` | vendor | Open tenders, bids and revisions, delivery. `vendor1` carries work at every stage. |
| `broker1` … `broker5` | broker | Assignments at every lifecycle stage, document requests, monitoring reports. |
| `admin1` | admin | Verification, blueprint publishing, payouts, anomalies, audit trail. |

`investor1` exists only so the investment fixtures have a user to join on: the platform has no investor
surface, and the account lands on the bond catalog at `/bonds`.

To test the verification flow itself, register a new account: it starts unverified, and a company cannot
reach the rest of `/business` until its document pack has been cleared. Change or remove these credentials
before a deployment is shared publicly.

Full instructions (role-scoped dev servers, the database workflow, deployment, troubleshooting) are in
[INSTALLATION.md](INSTALLATION.md).

## Documentation

| Document | Contents |
|---|---|
| [INSTALLATION.md](INSTALLATION.md) | Requirements, install, running, demo accounts, database workflow, build and deploy, configuration, troubleshooting. |
| [TECH_STACK.md](TECH_STACK.md) | Every runtime, framework and library with its version and where it lives. |
| [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) | Architecture, package boundaries, request lifecycle, auth and verification, HTTP API reference, data model, migrations, UI conventions. |
| [docs/adr/](docs/adr/) | Architecture decision records, oldest first. |
| [docs/BROKERROLE.md](docs/BROKERROLE.md) | Broker role specification: responsibilities, financial boundary, document and reporting flows. |
| [docs/VENDORROLE.md](docs/VENDORROLE.md) | Vendor role specification: participation rules, tender and proposal lifecycle, delivery obligations. |
| [docs/GLOSSARY-ajukan-proyek.md](docs/GLOSSARY-ajukan-proyek.md) | The submission wizard step by step, with the Indonesian labels it was written in. |
| [DESIGN.md](DESIGN.md) | Design direction: palette, type, motif. |
| [CLAUDE.md](CLAUDE.md) | Project context for coding agents: stack, layout, roles, auth, seed accounts. |
| [agent.md](agent.md) | UI rules for the design system: components, typography, icons, layout, tokens. |

## Repository layout

```
apps/api/            Backend: Hono API, Drizzle schema, sessions, PDF writer (no React)
packages/ui/         Design system: shadcn components on radix primitives, RoleShell, charts, form bundle
packages/core/       Shared frontend contract: auth, guards, role nav/home, typed API client, partner registry
packages/landing/    Landing page sections
packages/business/   Company dashboard and submission wizard
packages/vendor/     Vendor dashboard
packages/broker/     Broker dashboard
packages/admin/      Admin console
packages/investor/   Public bond catalog
src/                 Web app: TanStack Start routes, router, Worker entry (src/server.ts)
drizzle/             Generated D1 migrations
docs/                Role specifications, ADRs, glossary
scripts/             Demo accounts and the seed-fixture generator
```

## Quality checks

```bash
bun run typecheck        # tsc --noEmit
bun run check            # biome check (format + lint)
bun run check --write    # apply safe fixes
bun run build            # production build
bun run generate-routes  # regenerate the TanStack Router route tree
```
