# Technology Stack

This document lists the technologies GreenShift is built on, why they were chosen, and where they live in
the repository.

## Overview

GreenShift is a single Cloudflare Worker that serves both the server-rendered React application and the
JSON API at `/api/*`. Data lives in D1 (SQLite), sessions and rate limits in KV, and static assets in R2.

## Frontend

| Technology | Version | Role |
|---|---|---|
| React | 19.2 | UI runtime (function components, hooks). |
| TanStack Start | latest | SSR framework, server functions, streaming. |
| TanStack Router | latest | File-based, fully typed routing (`src/routes/*`). |
| TanStack Query | latest | Server-state fetching, caching, and mutations. |
| TanStack Table | 8.21 | Headless tables: sorting, filtering, pagination, column definitions. |
| TanStack Form | 1.33 | Headless forms: field state, validation, submission. |
| TypeScript | 6.0 | Strict typing across all packages. |
| Tailwind CSS | 4.1 | Utility-first styling (`@tailwindcss/vite`). |
| shadcn/ui + react-aria | 1.19 | Accessible component primitives. |
| @visx/* | 4.0 | Chart scales, grids, groups, shapes and patterns (`packages/ui/src/components/charts`). |
| Motion | 13.x | Chart and UI animation (`motion/react`). |
| d3-shape | 3.2 | Pie/arc geometry for the chart package. |
| Number Flow | 0.6 | Animated numeric transitions on statistic cards. |
| Font Awesome | 7.x | Icons. |
| DM Sans | 5.x | The single typeface, self-hosted via fontsource. |

## Backend

| Technology | Version | Role |
|---|---|---|
| Hono | 4.13 | HTTP API framework, mounted in the same Worker at `/api/*`. |
| Drizzle ORM | 0.45 | Typed SQL query builder for D1. |
| Drizzle Kit | 0.31 | Migration generation. |
| PBKDF2 (WebCrypto) | 600k iterations | Password hashing. |
| KV sessions | - | Opaque session tokens with idle and absolute expiry. |

## Data and platform

| Service | Binding | Role |
|---|---|---|
| Cloudflare Workers | - | Single compute bundle for SSR + API. |
| Cloudflare D1 | `DB` | SQLite database (source of truth). |
| Cloudflare KV | `KV` | Sessions and rate-limit counters. |
| Cloudflare R2 | `R2` | Object storage for assets/documents. |

All bindings are declared in `wrangler.jsonc`.

## Build and tooling

| Tool | Version | Role |
|---|---|---|
| Bun | 1.x | Package manager and script runner (workspaces: `apps/*`, `packages/*`). |
| Vite | 8.0 | Dev server and bundler, via `@cloudflare/vite-plugin`. |
| Wrangler | 4.70 | Cloudflare dev/deploy CLI and D1 migrations. |
| Biome | 2.4 | Formatting and linting. |
| tsc | 6.0 | Type checking (`bun run typecheck`). |

## Repository layout by technology

```
apps/api/        Hono + Drizzle + D1 (no React)
packages/ui/     Design system (shadcn + react-aria + Tailwind)
packages/core/   Shared frontend contract (auth, guards, typed API client)
packages/landing/    Landing page
packages/business/   Business dashboard
packages/vendor/     Vendor dashboard
packages/broker/     Broker dashboard
packages/admin/      Admin dashboard
packages/investor/   Public bond catalog
src/             TanStack Start app: routes, router, Worker entry (server.ts)
drizzle/         Generated D1 migrations
docs/            Role specifications (broker, vendor)
scripts/         Demo-user seeder and seed-fixture generator
```

## Constraints and conventions

- One Worker, one build, one database. Role packages are isolated by import discipline, not runtime federation.
- Role packages import only from `@greenshift/core`, `@greenshift/ui`, and `@tanstack/*`.
- All database access goes through Drizzle (`createDb(env.DB)`); there are no direct D1 binding calls.
- Timestamps are stored as epoch milliseconds (`timestamp_ms`).

## TanStack usage

TanStack libraries are the default choice for their problem domain, and are the only third-party libraries used
for routing, data fetching, tables, and forms.

| Concern | Library | Where |
|---|---|---|
| Routing + URL state | TanStack Router | `src/routes/*`, `src/router.tsx` |
| SSR + server functions + mutations scope | TanStack Start | `src/server.ts`, `src/routes/*` |
| Server state (fetching, caching, invalidation) | TanStack Query | every dashboard page (`useQuery` / `useQueryClient`) |
| Tables | TanStack Table | `DataTable` in `packages/ui/src/components/ui/data-table.tsx`, used by all admin tables |
| Forms | TanStack Form | `useAppForm` + `TextField`/`PasswordField`/`SubmitButton` in `packages/ui/src/components/form/form.tsx`, used by login, register, and the step-up dialog |
| Devtools | TanStack Devtools (Query/Router) | dev builds only |

Router, Start and Query cover routing, SSR and server state; Table and Form were added and adopted everywhere
(no page hand-writes table markup or manages form state with `useState`). No other library duplicates a
TanStack concern, so nothing else was replaced. Deliberately not adopted:

| Candidate | Why not |
|---|---|
| `react-virtual` | Tables use pagination instead of windowing. |
| `react-pacer` | Search filters a bounded client-side dataset. |
| `react-store` | Shared UI state is small and lives in React context. |
