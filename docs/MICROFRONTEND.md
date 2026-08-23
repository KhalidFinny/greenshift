# GreenShift Microfrontend Architecture

GreenShift is a **role-based microfrontend** organized as a Bun workspace monorepo that composes into **one Cloudflare Worker** — one build, one deploy, one API, one database.

## Shape

```
apps/
  api/            BE — Hono API (auth, sessions, passwords), D1 schema, Env bindings
packages/
  ui/             Design system — shadcn components, Header/Footer, RoleShell, EmptyState, cn, styles
  core/           FE shared contract — useAuth, guards, roleNav/roleHome, typed API client + request, query, types
  landing/        Public landing page (components + hooks)
  business/       Role package — business dashboard
  investor/       Role package — investor dashboard
  vendor/         Role package — vendor dashboard
  admin/          Role package — admin dashboard
src/              The web app — TanStack Start routes, router, worker entry (server.ts), session fn, styles
```

## The "micro" boundary

Each role package is an independent unit owned by a developer. The boundary is enforced by **folder + import discipline**, not runtime federation:

- A role package imports **only** from `@greenshift/ui`, `@greenshift/core`, and `@tanstack/*`.
- A role package **never** imports another role package.
- The web app (`src/`) is the composition layer: route files import the role packages and mount them under guarded layouts (`src/routes/_auth.<role>.tsx`).
- The backend (`apps/api`) imports nothing from the web app or role packages.

Why not Module Federation? Federation splits builds and loads remote entries at runtime — pointless for a single Worker bundle. The same organizational benefits (isolated packages, zero merge conflicts) come from the import contract above, without the runtime cost.

## Shared contract (`packages/core`)

- `auth/` — `AuthUser`/`UserRole` types, `useAuth`, `requireRole`, `roleHome`, `roleNav`, `getDevRole`/`getDevScope`
- `api/` — `request<T>()` network helper (single same-origin API), `ApiError`, typed `api` client
- `query/` — TanStack Query provider integration
- Types re-exported from `@greenshift/api` (D1 schema is the single source of truth)

## Design system (`packages/ui`)

- `components/ui/*` — shadcn primitives (Button, Input, Label, Avatar, …)
- `components/layout/*` — Header (public) / Footer, hidden when authenticated
- `layouts/role-shell.tsx` — the app shell: sidebar (logo, nav, account), invisible header (menu name, notifications, account menu). Pure UI; logic lives in `useRoleShell`
- `EmptyState`, `cn`

## Roles & auth

4 roles: `business`, `investor`, `vendor`, `admin` (D1 enum + `UserRole`).

Flow: login (`POST /api/auth/login`) → PBKDF2 verify → KV session → httpOnly cookie → root `beforeLoad` hydrates `context.user` via `getSessionFn` (server fn). Guards (`requireRole`) redirect unauthenticated users to `/login` and wrong-role users to their role home.

## Dev model

Each surface has its own dev server (`bun run dev:<role>`, `dev:landing`, `dev:auth`) — role-scoped servers restrict login to that role and redirect `/` to `/login`. See `HOW_TO_RUN.md`.

## Scaling note

Because each role package is a clean unit with a shared contract, splitting into separate Workers later (e.g., per-role API workers) is a mechanical extraction — the import boundaries are already drawn.
