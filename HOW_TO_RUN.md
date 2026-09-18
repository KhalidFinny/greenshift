# How to Run GreenShift — Frontend

> For the team trying the frontend. The dev server simulates everything locally (API, D1, KV, R2) — **no external backend needed**.

## Prerequisites

- [Bun](https://bun.sh) (>= 1.x)

## Install

```bash
bun install
```

## Run

```bash
bun run dev            # full app — landing, login, all role dashboards — localhost:3000
```

Role-scoped dev servers (login restricted to that role, one-click dev login on the login page):

```bash
bun run dev:business   # business role only — port 3001
bun run dev:vendor     # vendor role only — port 3002
bun run dev:investor   # investor role only — port 3004
bun run dev:broker     # broker role only — port 3005
bun run dev:admin      # admin role only — port 3006
bun run dev:landing    # landing page only — port 3007
```

## Login

All passwords are `12345678`. Seed the demo users once with `bun run db:setup` (the local D1
database is created the first time the dev server starts). Type the username or `username@greenshift.dev`:

| Username | Role |
|---|---|
| `business1` | business |
| `investor1` | investor |
| `vendor1` | vendor |
| `broker1` | broker |
| `admin` | admin |

## Frontend packages

| Package | Purpose |
|---|---|-
| `src/` | Web app — routes, router, entry (the composition layer) |
| `packages/ui` (`@greenshift/ui`) | Design system — shadcn components, RoleShell, Header/Footer, loaders, EmptyState, `cn` |
| `packages/core` (`@greenshift/core`) | Shared FE contract — `useAuth`, guards, `roleNav`/`roleHome`, typed API client + `request`, query |
| `packages/landing` (`@greenshift/landing`) | Landing page components + hooks |
| `packages/investor` (`@greenshift/investor`) | Public bond catalog (`/bonds`) |
| `packages/business` \| `vendor` \| `broker` \| `admin` | Role dashboards |

## Rules (must)

1. **Semantic HTML** — `<header>`, `<nav>`, `<main>`, `<aside>`, `<section>`, `<footer>`, `<h1>`–`<h6>`, `<button>`, `<a>` with `aria-label` where needed. No div-soup for structure.
2. **Shared utilities** — import from `@greenshift/ui` and `@greenshift/core`; a role package must **never** import another role package; never re-implement something that exists in shared.
3. Architecture + boundaries: `TECHNICAL_DOCUMENTATION.md`.
