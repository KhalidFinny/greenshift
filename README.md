# GreenShift

Platform MRV untuk Pembiayaan Hijau — role-based dashboards for **business**, **vendor**, and **admin**, plus a public **Obligasi** dashboard, served from one Cloudflare Worker.

## Stack

- **Frontend** — TanStack Start (SSR + file routes) + React 19 + TanStack Router/Query
- **Backend** — Hono API mounted in the same worker (`/api/*`), typed session auth (PBKDF2 + KV sessions)
- **Data** — Cloudflare D1 (Drizzle ORM), KV (sessions), R2
- **UI** — Tailwind CSS v4 + shadcn/ui (react-aria), 10px radius design system
- **Tooling** — Bun workspace monorepo (`apps/*`, `packages/*`), Vite 8 via the Cloudflare plugin, Biome, TypeScript strict

## Quick start

```bash
bun install
bun run dev          # full app at localhost:3000
bun run dev:business # role-scoped dev server (business only, port 3001)
```

Login with `business1` / `vendor1` / `admin` (password `12345678`).

## Structure

```
apps/api/        BE — Hono API, D1 schema, sessions
packages/ui/     design system (shadcn, RoleShell, Header/Footer)
packages/core/   FE shared contract (auth, guards, typed API client)
packages/landing/  landing page
packages/{business,vendor,admin}/  role packages
packages/investor/  public obligasi dashboard (market + detail)
src/             web app (routes, router, worker entry)
```

See **[HOW_TO_RUN.md](HOW_TO_RUN.md)** for commands and per-package guidance, and **[docs/MICROFRONTEND.md](docs/MICROFRONTEND.md)** for the microfrontend architecture.

## Scripts

`dev` / `dev:<role>` / `dev:landing` / `dev:auth` · `build` · `deploy` · `typecheck` · `db:generate` · `format` / `lint` / `check`
