# Technology Stack

What GreenShift runs on, and where each piece lives in the repository. The versions are the ones installed in
the workspace.

## Overview

GreenShift is a single Cloudflare Worker that serves both the server-rendered React application and the JSON
API at `/api/*`. Data lives in D1 (SQLite), sessions and rate-limit counters in KV, uploaded files in R2, and
document reading plus the analyst narrative run through Workers AI.

## Frontend

| Technology | Version | Role |
|---|---|---|
| React | 19.2 | UI runtime (function components, hooks). |
| TanStack Start | 1.168 | SSR framework, server functions, streaming. |
| TanStack Router | 1.170 | File-based, fully typed routing (`src/routes/*`). |
| TanStack Query | 5.101 | Server-state fetching, caching and mutations. |
| TanStack Table | 8.21 | Headless tables: sorting, search, pagination, column definitions. |
| TanStack Form | 1.33 | Headless forms: field state, validation, submission. |
| TypeScript | 6.0 | Strict typing across all packages. |
| Tailwind CSS | 4.3 | Utility-first styling (`@tailwindcss/vite`). |
| shadcn | 4.14 | CLI that generated the component sources in `packages/ui`. |
| radix-ui | 1.6 | The primitive set the components are built on: dialog, dropdown, select, tabs, tooltip and the rest. |
| Font Awesome | 7.3 | The icon set the UI guidelines call for (`agent.md`). |
| lucide-react | 1.34 | Icons inside the shadcn primitives and a few landing sections. |
| @visx/* | 4.0 | Chart scales, grids, groups, shapes and patterns (`packages/ui/src/organisms/charts`). |
| Motion | 13.4 | Chart and UI animation (`motion/react`). |
| d3-shape | 3.2 | Pie and arc geometry for the chart package. |
| @number-flow/react | 0.6 | Animated numeric transitions on statistic cards. |
| DM Sans | 5.3 | The app typeface: `--font-sans`, and `--font-heading` is an alias of it. Self-hosted via fontsource. |
| IBM Plex Sans | 5.3 | Imported by the design system and used explicitly by the landing hero (`packages/landing/src/components/organisms/HeroSection.tsx`). Self-hosted via fontsource. |

`react-aria-components`, `@base-ui/react` and `@hugeicons/react` are declared in the root manifest, and Vite
still lists `react-aria-components` and `@hugeicons/react` in `optimizeDeps.include`
(`vite.config.ts`), but no component imports any of the three. The accessible primitives in use come from
`radix-ui`.

## Backend

| Technology | Version | Role |
|---|---|---|
| Hono | 4.13 | HTTP API framework, mounted in the same Worker at `/api/*`. |
| Drizzle ORM | 0.45 | Typed SQL query builder for D1. |
| Drizzle Kit | 0.31 | Migration generation. |
| PBKDF2 (WebCrypto) | 100k iterations | Password hashing. workerd rejects higher iteration counts, so this is the platform ceiling. |
| KV sessions | | Opaque 32-byte session tokens with idle and absolute expiry, plus a CSRF token and a step-up deadline. |

## Data and platform

| Service | Binding | Role |
|---|---|---|
| Cloudflare Workers | | Single compute bundle for SSR and API. |
| Cloudflare D1 | `DB` | SQLite database (source of truth). |
| Cloudflare KV | `KV` | Sessions and rate-limit counters. |
| Cloudflare R2 | `R2` | Uploaded documents and images. |
| Workers AI | `AI` | Reads filed certificates (`toMarkdown` plus an instruct model) and writes the analyst narrative. Optional: without it the deterministic fallback in `apps/api/src/modules/business/risk/eleanor.service.ts` runs. |

All bindings are declared in `wrangler.jsonc`.

## Build and tooling

| Tool | Version | Role |
|---|---|---|
| Bun | 1.4 | Package manager and script runner (workspaces: `apps/*`, `packages/*`). |
| Vite | 8.1 | Dev server and bundler, through `@cloudflare/vite-plugin` 1.47. |
| Wrangler | 4.114 | Cloudflare dev/deploy CLI and D1 migrations. |
| Biome | 2.4 | Formatting and linting. |
| tsc | 6.0 | Type checking (`bun run typecheck`). |

## Repository layout by technology

```
apps/api/        Hono + Drizzle + D1, sessions, PDF writer (no React)
packages/ui/     Design system (shadcn on radix + Tailwind, charts, form bundle)
packages/core/   Shared frontend contract (auth, guards, typed API client, partner registry)
packages/landing/    Landing page sections
packages/business/   Company dashboard and submission wizard
packages/vendor/     Vendor dashboard
packages/broker/     Broker dashboard
packages/admin/      Admin console
packages/investor/   Public bond catalog
src/             TanStack Start app: routes, router, Worker entry (server.ts)
drizzle/         Generated D1 migrations
docs/            Role specifications, ADRs, glossary
scripts/         Demo accounts and the seed-fixture generator
```

## Constraints and conventions

- One Worker, one build, one database. Role packages are isolated by import discipline, not runtime
  federation.
- Role packages import only from `@greenshift/core`, `@greenshift/ui` and `@tanstack/*`.
- All database access goes through Drizzle (`createDb(env.DB)`); there are no direct D1 binding calls.
- Timestamps are stored as epoch milliseconds (`timestamp_ms`).

## TanStack usage

TanStack libraries are the default choice for their problem domain, and the only third-party libraries used
for routing, data fetching, tables and forms.

| Concern | Library | Where |
|---|---|---|
| Routing and URL state | TanStack Router | `src/routes/*`, `src/router.tsx` |
| SSR, server functions, mutations scope | TanStack Start | `src/server.ts`, `src/routes/*` |
| Server state (fetching, caching, invalidation) | TanStack Query | every dashboard page (`useQuery` / `useQueryClient`) |
| Tables | TanStack Table | `DataTable` in `packages/ui/src/organisms/data-table.tsx`, used by the project list, the admin tables and every other table |
| Forms | TanStack Form | `useAppForm` plus the field bundle (`TextField`/`NumberField`/`SelectField`/`TextareaField`/`CheckboxField`/`PasswordField`/`SubmitButton`) in `packages/ui/src/molecules/form.tsx`, used by login, register, the step-up dialog and the submission wizard |
| Devtools | TanStack Devtools (Query, Router) | dev builds only |

Router, Start and Query cover routing, SSR and server state; Table and Form are adopted everywhere, so no page
hand-writes table markup or manages form state with `useState`. No other library duplicates a TanStack
concern. Deliberately not adopted:

| Candidate | Why not |
|---|---|
| `react-virtual` | Tables use pagination instead of windowing. |
| `react-pacer` | Search filters a bounded client-side dataset. |
| `react-store` | Shared UI state is small and lives in React context. |
