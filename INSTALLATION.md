# Installation and Usage

Everything runs locally: the dev server simulates the API, D1, KV and R2, so no external backend or cloud
account is needed for development. This document covers requirements, running the app, the demo accounts, the
database workflow and deployment; the architecture is in
[TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) and the stack in [TECH_STACK.md](TECH_STACK.md).

## Requirements

- [Bun](https://bun.sh) 1.x (package manager and script runner)
- A Cloudflare account and Wrangler (only for remote deployment)

Wrangler comes from the workspace (`bunx wrangler ...`); no global install is needed.

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

All passwords are `12345678`. You may type the username or the full email. The accounts are rows in the local
D1 database, so load the seed once (see [Database setup](#database-setup)) after the dev server has created
that database.

| Username | Email | Role |
|---|---|---|
| `business1` | `business1@greenshift.dev` | business |
| `vendor1` | `vendor1@greenshift.dev` | vendor |
| `broker1` | `broker1@greenshift.dev` | broker |
| `admin1` | `admin1@greenshift.dev` | admin |

The seed writes ten companies (`business1` to `business10`), ten vendors (`vendor1` to `vendor10`), five
brokers (`broker1` to `broker5`) and `admin1`. `investor1` exists only as the user the investment and ROI
fixtures join on: the platform has no investor surface, and an investor account lands on the public bond
catalog at `/bonds`.

The seeded companies are verified and the seeded `broker1` is a verified broker with assignments in every
lifecycle stage. A broker registered from scratch is unverified and sees the verification gate until an
administrator approves the profile.

## Project conventions

- Role packages (`packages/<role>`) import only from `@greenshift/core`, `@greenshift/ui` and `@tanstack/*`,
  and never from another role package. The boundaries are documented in
  [TECHNICAL_DOCUMENTATION.md § 2](TECHNICAL_DOCUMENTATION.md#2-monorepo-and-package-boundaries).
- UI work follows [agent.md](agent.md): shared `@greenshift/ui` components used as-is, design tokens instead
  of literal colours, Font Awesome icons.
- Semantic HTML and the shared utilities are mandatory; do not re-implement something that already exists in
  `@greenshift/ui` or `@greenshift/core`.

## Database setup

D1 is the source of truth. Migrations live in `drizzle/` and the schema in `apps/api/src/db/schema.ts`.

```bash
# Apply migrations to the local D1 database
bunx wrangler d1 migrations apply greenshift-db --local

# Generate the fixture file, then load it
bunx tsx scripts/seed.ts > scripts/seed.sql
bunx wrangler d1 execute greenshift-db --local --file=scripts/seed.sql

# After a schema change: generate a new migration
bun run db:generate
```

`scripts/seed.ts` prints the whole fixture set: accounts, vendor fixtures, the bond catalog and the broker
fixtures. `scripts/accounts.ts` is the single source of truth for a company's name, sector and address, and
the generated file resets every table it owns (children before parents, so the foreign keys hold) before
inserting, which makes it re-runnable locally. That reset is destructive: point it at a local database only.

Migrations are also applied by Wrangler when the dev server starts (`migrations_dir` in `wrangler.jsonc`), so
an existing database picks up a new migration on the next run.

### Resetting locally

`bunx tsx scripts/seed.ts > scripts/seed.sql` followed by `bunx wrangler d1 execute ... --file=scripts/seed.sql`
is all that is needed. To rebuild the database completely, delete
`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` and restart the dev server, which re-applies the
migrations.

**The full seed drops every local row it manages**: accounts, sessions, projects, milestones, MRV reports and
anything else you created locally. It is a local-development file, not a deployment step. It also replaces
the `users` rows with new ids, so every session stops resolving and you have to log in again.

## Build and deploy

```bash
bun run build    # production build
bun run preview  # preview the production build locally
bun run deploy   # build and deploy to Cloudflare (wrangler deploy)
```

`wrangler deploy` needs an authenticated account (`bunx wrangler login`, or a `CLOUDFLARE_API_TOKEN` in the
environment). The Worker name, the D1 database, the KV namespace, the R2 bucket and the Workers AI binding
are declared in `wrangler.jsonc`; on a fresh account, create the D1 database, KV namespace and R2 bucket
first and paste the returned IDs into that file:

```bash
bunx wrangler d1 create greenshift-db
bunx wrangler kv namespace create KV
bunx wrangler r2 bucket create greenshift-assets
```

Deploying publishes the app on the custom domain declared in the `routes` block of `wrangler.jsonc`
(`greenshift.fiinnyy.my.id`): Wrangler creates the DNS record and the certificate itself, so the zone must
live in the same account. Remove that block to fall back to `<worker-name>.<your-subdomain>.workers.dev`.

### Deploying the database

The deployed database starts empty. Apply the migrations before releasing:

```bash
bunx wrangler d1 migrations apply greenshift-db --remote

# Inspect what the deployed database holds
bunx wrangler d1 execute greenshift-db --remote --command "SELECT email, role FROM users"
```

`scripts/seed.sql` carries the demo fixtures as well as the demo accounts, and it begins with a destructive
reset, so it must never be pointed at a database holding real accounts or projects. It was applied once to
the deployed database at a point when that database held nothing but demo accounts, so the deployment now
carries the full fixture set. Passwords are hashed at generation time, so the logins are the same ones the
local seed creates (password `12345678`); change or remove them before a deployment is shared publicly.

## Quality checks

```bash
bun run typecheck        # tsc --noEmit
bun run check            # biome check (format + lint)
bun run check --write    # apply safe fixes
bun run generate-routes  # regenerate the TanStack Router route tree
```

## Environment and configuration

- Bindings (`DB`, `KV`, `R2`, `AI`) are declared in `wrangler.jsonc`.
- `SESSION_IDLE_MINUTES` optionally overrides the default 15-minute idle session timeout.
- Dev-only role scoping uses `VITE_ROLE=<role>` and `VITE_SCOPE=landing`.

## Troubleshooting

- **Port already in use**: Vite automatically tries the next free port; check the terminal for the actual URL.
- **`imported but could not be resolved` from the dependency pre-bundler**: a dependency is missing from the
  lockfile; run `bun install` and restart the dev server (Vite re-optimizes when the lockfile changes).
- **The dev server serves a stale transform**: after editing a file, Vite sometimes keeps the previous
  module. `touch` the file or restart the dev server.
- **Login rejects a demo account**: the accounts are rows in D1, not code; load the seed.
- **A company verification scan never passes locally**: the Workers AI binding has no local runtime, so
  `env.AI` throws under `wrangler dev` and the scan always lands on the "could not be read" branch. Test the
  scan on a deployed worker.
- **Stale data after schema changes**: regenerate and re-apply migrations, then re-run the seed.
- **`PROPOSAL_CONFLICT` / duplicate errors in demos**: the unique indexes enforce one proposal per vendor per
  tender; reset the local database and reseed to start clean.
