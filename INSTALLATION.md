# Installation and Usage

Everything runs locally: the dev server simulates the API, D1, KV and R2, so no external backend or cloud
account is required for development.

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
bun run dev:admin      # admin role only          (port 3006)
bun run dev:landing    # public site only         (port 3007)
bun run dev:auth       # login/auth work          (port 3008)
```

### Seeded accounts

All seeded passwords are `12345678`. You may type the username or the full email.

| Username | Email | Role |
|---|---|---|
| `business1` | `business1@greenshift.dev` | business |
| `vendor1` | `vendor1@greenshift.dev` | vendor |
| `admin` | `admin@greenshift.dev` | admin |

The public surfaces (`/`, `/bonds`) need no account.

## Database setup

D1 is the source of truth. Migrations live in `drizzle/` and the schema in `apps/api/src/db/schema.ts`.

```bash
# Apply migrations to the local D1 database
bunx wrangler d1 migrations apply greenshift-db --local

# Regenerate the seed fixtures from scripts/seed.ts
bunx tsx scripts/seed.ts > scripts/seed.sql

# Load the seed data (users, projects, tenders, proposals, blueprints, MRV reports)
bunx wrangler d1 execute greenshift-db --local --file=scripts/seed.sql

# After a schema change: generate a new migration
bun run db:generate
```

To start from a clean local database, delete the files under
`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`, re-apply the migrations, and re-run the seed.

## Build and deploy

```bash
bun run build    # production build
bun run preview  # preview the production build locally
bun run deploy   # build and deploy to Cloudflare (wrangler deploy)
```

Apply migrations to the deployed database before releasing:

```bash
bunx wrangler d1 migrations apply greenshift-db --remote
```

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
- **Stale data after schema changes**: regenerate and re-apply migrations, then re-run the seed.
- **`PROPOSAL_CONFLICT` / duplicate errors in demos**: the unique indexes enforce one proposal per vendor per
  tender; reset the local database and reseed to start clean.
