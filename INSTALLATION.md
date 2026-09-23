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

## Login and test accounts

Every seeded account uses the password `12345678`, and the login form takes either
the username or the full email (`business1` or `business1@greenshift.dev`). The
accounts are rows in the D1 database, so load the seed once (see
[Database setup](#database-setup)) after the dev server has created that database.
The deployed database carries the same accounts.

| Username | Email | Role | Person | Organization |
|---|---|---|---|---|
| `business1` | `business1@greenshift.dev` | company | Rangga Wibisono | PT Green Nusantara |
| `business2` | `business2@greenshift.dev` | company | Sinta Maharani | PT Sinar Abadi Textile |
| `business3` | `business3@greenshift.dev` | company | Yusuf Hidayat | PT Pangan Utama |
| `business4` | `business4@greenshift.dev` | company | Ratna Kusuma | PT Semen Nusantara |
| `business5` | `business5@greenshift.dev` | company | Agus Prakoso | PT Agro Industri Nusantara |
| `business6` | `business6@greenshift.dev` | company | Bambang Sutrisno | PT Kertas Nusantara |
| `business7` | `business7@greenshift.dev` | company | Dedi Kurniawan | PT Baja Prima |
| `business8` | `business8@greenshift.dev` | company | Maya Puspita | PT Graha Sentra Properti |
| `business9` | `business9@greenshift.dev` | company | Iwan Susanto | PT Sawit Lestari |
| `business10` | `business10@greenshift.dev` | company | Nur Aini | PT Tekstil Jaya |
| `vendor1` | `vendor1@greenshift.dev` | vendor | Andi Saputra | EcoTech Solutions |
| `vendor2` | `vendor2@greenshift.dev` | vendor | Dewi Anggraini | PT Eco Power Indonesia |
| `vendor3` | `vendor3@greenshift.dev` | vendor | Bayu Nugroho | PT Bio Thermal Energy |
| `vendor4` | `vendor4@greenshift.dev` | vendor | Lestari Widodo | PT Solar Cipta Energi |
| `vendor5` | `vendor5@greenshift.dev` | vendor | Fajar Ramadhan | PT Efisiensi Mesin Nusantara |
| `vendor6` | `vendor6@greenshift.dev` | vendor | Komang Aditya | PT Sinar Energi Terang |
| `vendor7` | `vendor7@greenshift.dev` | vendor | Sri Wahyuni | PT Karya Efisiensi Industri |
| `vendor8` | `vendor8@greenshift.dev` | vendor | Yoga Pratama | PT Mitra Kendali Termal |
| `vendor9` | `vendor9@greenshift.dev` | vendor | Andi Tenri | PT Cahaya Teknik Mandiri |
| `vendor10` | `vendor10@greenshift.dev` | vendor | Gunawan Wibowo | PT Rekayasa Termal Nusantara |
| `broker1` | `broker1@greenshift.dev` | broker | Budi Santoso | Capital Green Securities |
| `broker2` | `broker2@greenshift.dev` | broker | Rina Hartati | Nusantara Sekuritas Hijau |
| `broker3` | `broker3@greenshift.dev` | broker | Hendra Gunawan | Mitra Obligasi Indonesia |
| `broker4` | `broker4@greenshift.dev` | broker | Clara Wijaya | Pacific Sustainable Capital |
| `broker5` | `broker5@greenshift.dev` | broker | Teguh Prasetya | Graha Green Underwriters |
| `admin1` | `admin1@greenshift.dev` | admin | Administrator | - |
| `investor1` | `investor1@greenshift.dev` | investor | Green Fund Capital | Green Fund Capital |

What to open with each role: the ten companies each run two procurement rounds (one open
and taking bids, one awarded) with five bidders drawn from the vendor pool, so any of them
shows matchmaking, tenders and awards with real data; `vendor1` (EcoTech Solutions) carries
deals at every stage, including awarded work with milestones and MRV periods; `broker1` has
assignments at every lifecycle stage with document requests in each state; `admin1` sees the
verification queues, blueprint publishing, payouts and the audit trail. `investor1` has no
surface: the account lands on the public bond catalog at `/bonds`.

The seeded companies and vendors are already verified, so every role surface opens
without going through the verification step. To exercise that step instead,
register a new account: it starts unverified, and a company account cannot reach
the rest of `/business` until the document scan (or an administrator) has cleared
its pack.

Change or remove these credentials before a deployment is shared publicly.

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
