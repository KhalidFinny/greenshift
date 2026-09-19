# GreenShift

**MRV platform for green financing.** GreenShift validates industrial energy-efficiency projects, builds a
*Green Project Blueprint*, and connects projects to green funding through licensed SCF partners.

The application is a role-based microfrontend monorepo that compiles into a single Cloudflare Worker: one
build, one deploy, one API, one database.

## Surfaces

| Surface | Route | Who | What it does |
|---|---|---|---|
| Landing | `/` | public | Marketing site: hero, how it works, ecosystem, FAQ, contact. |
| Bond catalog | `/bonds` | public | Verified bond listings (`GET /api/investor/market`). Bonds are sold via brokers, so there is no buy/portfolio flow. |
| Business dashboard | `/business` | role `business` | Placeholder shell: project intake, assessment results and tendering are not implemented yet. |
| Vendor dashboard | `/vendor` | role `vendor` | Discover open tenders, submit proposals, respond to revision requests, track procurement and delivery. |
| Broker dashboard | `/broker` | role `broker` | Prepare verified projects for bond issuance, request company documents, file monthly reports. |
| Admin console | `/admin` | role `admin` | Verify users/vendors, drive the project and blueprint lifecycle, pay out ROI, review the audit trail and the anomaly console. |

An `investor` account exists for demo purposes; its home is the public bond catalog.

## Quick start

```bash
bun install
bun run dev            # everything on http://localhost:3000
```

Seeded logins (password `12345678`) — run `bun run db:setup` once after the dev server has created the local
database:

| Username | Role |
|---|---|
| `business1` | business |
| `vendor1` | vendor |
| `broker1` | broker |
| `admin1` | admin |
| `investor1` | investor |

Full instructions (role-scoped dev servers, database workflow, deployment, troubleshooting) are in
[INSTALLATION.md](INSTALLATION.md).

## Documentation

| Document | Contents |
|---|---|
| [INSTALLATION.md](INSTALLATION.md) | Requirements, install, running (full app and role-scoped dev servers), accounts, database setup, build and deploy, configuration, troubleshooting. |
| [TECH_STACK.md](TECH_STACK.md) | Technology stack: every framework and library, its version, why it was chosen, and where it lives. |
| [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) | Architecture, package boundaries, request lifecycle, auth, security, HTTP API reference, data model, data-access conventions, verification. |
| [docs/BROKERROLE.md](docs/BROKERROLE.md) | Broker role specification: responsibilities, financial boundary, document and reporting flows. |
| [docs/VENDORROLE.md](docs/VENDORROLE.md) | Vendor role specification: participation rules, tender and proposal lifecycle, delivery obligations. |
| [agent.md](agent.md) | UI rules for the design system (components, typography, icons, layout, tokens). |

## Repository layout

```
apps/api/            Backend: Hono API, Drizzle schema, auth/sessions (no React)
packages/ui/         Design system: shadcn + react-aria components, RoleShell, charts, form bundle
packages/core/       Shared frontend contract: useAuth, guards, role nav/home, typed API client, query
packages/landing/    Landing page
packages/business/   Business dashboard
packages/vendor/     Vendor dashboard
packages/broker/     Broker dashboard
packages/admin/      Admin dashboard
packages/investor/   Public bond catalog
src/                 Web app: TanStack Start routes, router, Worker entry (src/server.ts)
drizzle/             Generated D1 migrations
docs/                Role specifications
scripts/             Demo user seeder and seed-fixture generator
```

## Quality checks

```bash
bun run typecheck        # tsc --noEmit
bun run check            # biome check (format + lint)
bun run check --write    # apply safe fixes
bun run build            # production build
bun run generate-routes  # regenerate the TanStack Router route tree
```
