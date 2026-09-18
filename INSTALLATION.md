# Installation and Usage

Everything runs locally: the dev server simulates the API, D1, KV and R2, so no external backend or cloud
account is required for development. This document covers requirements, running the app, the demo accounts, the
database workflow and deployment; the architecture is in
[TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) and the stack in [TECH_STACK.md](TECH_STACK.md).

## Requirements

- [Bun](https://bun.sh) >= 1.x (package manager and script runner)
- A Cloudflare account and Wrangler (only for remote deployment)

## Install

```bash
git clone <repository-url>
cd greenshift
bun install
```

## Run the app

```bash
bun run dev            # full app: landing, login, all role dashboards (http://localhost:3000)
```

The first page load may take a few seconds while the Worker isolate warms; the terminal prints
`SSR warmed in ...ms` when startup is complete.

### Role-scoped dev servers

These restrict login to a single role and redirect `/` to `/login`, which is convenient when working on one
dashboard. The role-scoped login page also offers a one-click dev login.

```bash
bun run dev:business   # business role only       (port 3001)
bun run dev:vendor     # vendor role only         (port 3002)
bun run dev:investor   # investor role only       (port 3004)
bun run dev:broker     # broker role only         (port 3005)
bun run dev:admin      # admin role only          (port 3006)
bun run dev:landing    # public site only         (port 3007)
bun run dev:auth       # login/auth work          (port 3008)
```

`vite` picks the next free port if one is taken; the terminal prints the URL it actually used.

### Dev-only switches

- `VITE_ROLE=<role>` scopes the app to one role (this is what the role-scoped scripts set) and is rejected for
  a role that does not exist.
- `VITE_SCOPE=landing` serves only the public site; every other route redirects to `/`.

## Login

All passwords are `12345678`. You may type the username or the full email. The demo accounts live in the local
D1 database, so create them once with `bun run db:setup` (see [Database setup](#database-setup)) after the dev
server has started at least once.

| Username | Email | Role |
|---|---|---|
| `business1` | `business1@greenshift.dev` | business |
| `vendor1` | `vendor1@greenshift.dev` | vendor |
| `broker1` | `broker1@greenshift.dev` | broker |
| `admin` | `admin@greenshift.dev` | admin |
| `investor1` | `investor1@greenshift.dev` | investor |

The public surfaces (`/`, `/bonds`) need no account; an investor account lands on the bond catalog.

`bun run db:setup` only creates the accounts: a fresh `broker1` has no licence filed yet, so the broker
dashboard shows the verification gate until the profile is submitted and verified (admin → broker
verification, or the seed fixtures, which ship a verified broker with assignments in every lifecycle stage).

## Project conventions

- Role packages (`packages/<role>`) import only from `@greenshift/core`, `@greenshift/ui` and `@tanstack/*`,
  and never from another role package. The boundaries are documented in
  [TECHNICAL_DOCUMENTATION.md § 2](TECHNICAL_DOCUMENTATION.md#2-monorepo-and-package-boundaries).
- UI work follows [agent.md](agent.md): shared `@greenshift/ui` components used as-is, one typeface, design
  tokens instead of literal colours, Font Awesome icons.
- Semantic HTML and the shared utilities are mandatory; do not re-implement something that already exists in
  `@greenshift/ui` or `@greenshift/core`.

## Database setup

D1 is the source of truth. Migrations live in `drizzle/` and the schema in `apps/api/src/db/schema.ts`.

```bash
# Apply migrations to the local D1 database
bunx wrangler d1 migrations apply greenshift-db --local

# Seed the demo users (idempotent; needs the local database, which the dev server
# creates on its first start)
bun run db:setup

# Regenerate the seed fixtures from scripts/seed.ts
bun scripts/seed.ts > scripts/seed.sql

# Load the seed data into a FRESH database (users, projects, tenders, proposals,
# blueprints, MRV reports, broker assignments with document requests and reports).
# This file inserts fixed accounts and is not idempotent: on a database that
# already has them, use `bun run db:setup` + `bun run db:setup:broker` instead.
bunx wrangler d1 execute greenshift-db --local --file=scripts/seed.sql

# After a schema change: generate a new migration
bun run db:generate
```

### Adding the broker fixtures to an existing database

Migration `0003` adds the broker tables and is applied by Wrangler when the dev server starts, so an
existing database needs no reset. The fixture *rows* are a separate step, because `scripts/seed.sql` inserts
fixed `@greenshift.dev` accounts and therefore conflicts when it is loaded into a database that already has
them:

```bash
bun run db:setup          # create any missing demo accounts (idempotent, skips existing rows)
bun run db:setup:broker   # apply only the broker fixtures (idempotent, one transaction)
```

`bun run db:setup:broker` needs migration `0003` applied and the earlier fixture projects present; it reports
what to do when either is missing, and it never modifies existing rows.

### Starting over

To rebuild the local database from scratch - which is the only way to re-run the full seed file - delete
`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`, restart the dev server (Wrangler re-applies the
migrations), then run `bun run db:setup` and load `scripts/seed.sql`.

**This drops every local row, not just the schema**: accounts, sessions, projects, milestones, MRV reports and
anything else you created locally. It is a fallback, not the normal path after a schema change.

## Build and deploy

```bash
bun run build    # production build
bun run preview  # preview the production build locally
bun run deploy   # build and deploy to Cloudflare (wrangler deploy)
```

`wrangler deploy` needs an authenticated account (`bunx wrangler login`, or a `CLOUDFLARE_API_TOKEN`
in the environment). The Worker name, the D1 database, the KV namespace and the R2 bucket are declared in
`wrangler.jsonc`; on a fresh account, create them first and paste the returned IDs into that file:

```bash
bunx wrangler d1 create greenshift-db
bunx wrangler kv namespace create KV
bunx wrangler r2 bucket create greenshift-assets
```

Deploying publishes the app on `<worker-name>.<your-subdomain>.workers.dev`; the subdomain is created on the
first deploy of the account.

### Deploying the database

Migrations and fixtures are separate steps, and the deployed database starts empty:

```bash
# 1. Apply migrations to the deployed database before releasing
bunx wrangler d1 migrations apply greenshift-db --remote

# 2. Load the demo accounts and fixtures into the deployed database (once, into an
#    empty database - the file is not idempotent)
bun scripts/seed.ts > scripts/seed.sql
bunx wrangler d1 execute greenshift-db --remote --file=scripts/seed.sql

# Inspect what the deployed database holds
bunx wrangler d1 execute greenshift-db --remote --command "SELECT email, role FROM users"
```

Passwords are hashed at generation time, so the accounts seeded remotely are the same demo logins
(`business1` / `vendor1` / `broker1` / `admin`, password `12345678`) - change or remove them before the
deployment is shared publicly.

## Quality checks

```bash
bun run typecheck        # tsc --noEmit
bun run check            # biome check (format + lint)
bun run check --write    # apply safe fixes
bun run generate-routes  # regenerate the TanStack Router route tree
```

## Environment and configuration

- Bindings (`DB`, `KV`, `R2`) are declared in `wrangler.jsonc`.
- `SESSION_IDLE_MINUTES` optionally overrides the default 15-minute idle session timeout.
- Dev-only role scoping uses `VITE_ROLE=<role>` and `VITE_SCOPE=landing`.

## Troubleshooting

- **Port already in use**: Vite automatically tries the next free port; check the terminal for the actual URL.
- **`imported but could not be resolved` from the dependency pre-bundler**: a dependency is missing from the
  lockfile; run `bun install` and restart the dev server (Vite re-optimizes when the lockfile changes).
- **Login rejects a demo account**: the accounts are rows in D1, not code — run `bun run db:setup`.
- **Stale data after schema changes**: regenerate and re-apply migrations, then re-run the seed.
- **`PROPOSAL_CONFLICT` / duplicate errors in demos**: the unique indexes enforce one proposal per vendor per
  tender; reset the local database and reseed to start clean.
