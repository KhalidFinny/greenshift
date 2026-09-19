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
| `admin1` | `admin1@greenshift.dev` | admin |
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

# Print only the account rows as idempotent SQL (safe to re-run, unlike the full
# fixture file above); this is what creates the logins on the deployed database.
bun run db:accounts > scripts/accounts.sql

# Load the demo fixtures (users, projects, tenders, proposals, blueprints, MRV
# reports, forecasts, broker assignments with document requests and reports).
# The file resets every table it owns before inserting, so it is safe to re-run
# against a local database. That reset is destructive by design: point it at a
# local database only, never at one that holds real accounts or projects.
bunx wrangler d1 execute greenshift-db --local --file=scripts/seed.sql

# After a schema change: generate a new migration
bun run db:generate
```

### Adding the broker fixtures to an existing database

Migration `0003` adds the broker tables and is applied by Wrangler when the dev server starts, so an
existing database needs no reset. The fixture *rows* are a separate step. Unlike the full seed, the broker
group inserts without resetting, so it applies on top of a database that already holds the earlier
fixtures:

```bash
bun run db:setup          # create any missing demo accounts (idempotent, skips existing rows)
bun run db:setup:broker   # apply only the broker fixtures (idempotent, one transaction)
```

`bun run db:setup:broker` needs migration `0003` applied and the earlier fixture projects present; it reports
what to do when either is missing, and it never modifies existing rows.

### Resetting locally

`bun scripts/seed.ts > scripts/seed.sql` followed by `wrangler d1 execute ... --file=scripts/seed.sql` is all
that is needed: the file deletes the fixture rows (children before parents, so the foreign keys hold) and
re-inserts them. To rebuild the database completely, delete
`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` and restart the dev server, which re-applies the
migrations.

**The full seed drops every local row it manages**: accounts, sessions, projects, milestones, MRV reports and
anything else you created locally. It is a local-development file, not a deployment step.

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

Deploying publishes the app on the custom domain declared in the `routes` block of `wrangler.jsonc`
(`greenshift.fiinnyy.my.id`): Wrangler creates the DNS record and the certificate itself, so the zone must
live in the same account. Remove that block to fall back to `<worker-name>.<your-subdomain>.workers.dev`.

### Deploying the database

Migrations and accounts are separate steps, and the deployed database starts empty:

```bash
# 1. Apply migrations to the deployed database before releasing
bunx wrangler d1 migrations apply greenshift-db --remote

# 2. Create the logins. The statements are idempotent, so this is safe to re-run
#    and never touches an account that already exists.
bun run db:accounts > scripts/accounts.sql
bunx wrangler d1 execute greenshift-db --remote --file=scripts/accounts.sql

# Inspect what the deployed database holds
bunx wrangler d1 execute greenshift-db --remote --command "SELECT email, role FROM users"
```

Passwords are hashed at generation time, so the accounts created remotely are the same logins
(`business1`…`business5`, `investor1`…`investor5`, `vendor1`…`vendor5`, `broker1`…`broker5`,
`admin1`…`admin5`, password `12345678`) - change or remove them before the deployment is shared publicly.
`scripts/accounts.sql` is the idempotent account-only file.

`scripts/seed.sql` carries the demo fixtures (projects, tenders, bonds, forecasts) and begins with a
destructive reset, so it must never be pointed at a database holding real accounts or projects. It **was**
applied once to the deployed database, at a point when that database contained nothing but demo accounts and
no projects at all, so the deployment now carries the full fixture set rather than accounts only. Once real
data exists there, this is no longer a safe operation.

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
