# Package and file structure

Audited and restructured 2026-09-23. This file records what the layout is, why it
is that shape, and what was deliberately left alone.

## The two rules

**1. A package is a microfrontend slice.** Each package under `packages/` owns one
surface of the product, exports it through a single barrel (`src/index.ts`), and
keeps its internals private. The web app in `src/routes` imports only from the
barrel: `@greenshift/vendor`, never `@greenshift/vendor/src/pages/...`. That is
what makes a package replaceable and its boundary real, and it is enforced by the
`exports` map in each `package.json` (`"."` only).

| Package | Slice | Public surface |
|---|---|---|
| `packages/ui` | The design system every other slice renders through | `@greenshift/ui` |
| `packages/core` | The shared frontend contract: auth, guards, nav, typed API client, partner registry | `@greenshift/core` |
| `packages/landing` | The public landing | `@greenshift/landing` |
| `packages/investor` | The public bond catalog | `@greenshift/investor` |
| `packages/business` | The company dashboard and the submission wizard | `@greenshift/business` |
| `packages/vendor` | The vendor dashboard: tenders, bids, delivery | `@greenshift/vendor` |
| `packages/broker` | The broker dashboard: assignments, documents, monitoring | `@greenshift/broker` |
| `packages/admin` | The admin console | `@greenshift/admin` |
| `apps/api` | The backend: Hono routes, services, repositories, Drizzle schema | `@greenshift/api` (types only for the frontend) |

Role packages never import each other. They share `@greenshift/ui` (how it looks)
and `@greenshift/core` (what it knows), which is the whole point of the split: a
change to the vendor slice cannot reach into the admin slice.

**2. Inside a slice, files are tiered by what they are.** Atomic design, applied
by meaning rather than by ceremony:

| Tier | What belongs | Example |
|---|---|---|
| `atoms/` | One element, no composition | `button.tsx`, `badge.tsx`, `spinner.tsx` |
| `molecules/` | A small composite with one job | `form.tsx` (label + input + error), `pagination-bar.tsx`, `detail-shell.tsx` |
| `organisms/` | A section or feature block built from molecules | `data-table.tsx`, `role-shell.tsx`, `charts/**`, `wizard/step-1.tsx` |
| `pages/` | One view per route | `pages/dashboard.tsx` |
| `lib/` | Non-visual code: mappers, formatters, hooks used inside the slice | `api-mappers.ts`, `format.ts` |
| `hooks/` | Shared React hooks (where a slice has enough of them to need the tier) | `use-paged-rows.ts` |
| `content/` | Copy and data a slice renders, kept out of the components | `landing/src/content/landing.ts` |

A tier folder exists only when at least two files belong to it. An empty or
one-file folder asserts a category the slice does not have.

## The tree as it stands

```
packages/ui/src/            atoms/ (19)  molecules/ (7)  organisms/ (5 + charts/ 58)  hooks/  lib/  styles.css
packages/core/src/          api/  auth/  geo/  query/            (domain modules, not visual tiers)
packages/landing/src/       components/{atoms,molecules,organisms}  content/  hooks/  mobile/
packages/business/src/      pages/ (12)  organisms/wizard/ (8)  lib/ (19)
packages/vendor/src/        pages/ (15)  organisms/ (33)  molecules/ (3)  lib/ (7)
packages/admin/src/         pages/ (6)   organisms/ (12)  molecules/ (3)  lib/ (5)
packages/investor/src/      pages/ (1)   molecules/ (2)   lib/ (3)
packages/broker/src/        pages/ (7)   lib/ (4)
apps/api/src/               lib/  db/  modules/<role>/<feature>/{routes,service,repository}
```

`apps/api` is tiered by feature rather than by shape, and stays that way: routes
are controllers, services hold the rules, repositories hold the Drizzle access.
That is the backend's own atomic unit, and it is consistent across every module.

## What was deliberately left alone

- **`packages/core` keeps domain folders** (`api`, `auth`, `geo`, `query`). It has
  no components to tier: every file in it is a contract or a hook. Forcing
  `atoms/molecules/organisms` on it would invent folders with nothing in them.
- **`packages/broker` has no molecule tier.** Seven pages and four lib files do
  not need one; the pages are already the unit. It gains a tier when a component
  is used by two pages.
- **`packages/business/pages/matchmaking-shared.tsx`** is shared composites
  (`ProjectFacts`, `StageBand`, `CriteriaPanel`) used by three matchmaking pages,
  so its honest tier is `organisms/`. It sits in `pages/` because it is one file:
  a folder for a single file is worse than a slightly wrong tier. Move it when a
  second shared composite appears.
- **`packages/landing/components/*`** keeps a `components/` wrapper around its
  tiers. It predates the tiering and the mobile composition imports into it; the
  flattening is a rename with no behaviour behind it, so it waits for a real
  change to that package.
- **`packages/ui/organisms/charts/tooltip/index.ts`** is an internal barrel inside
  the chart subtree, kept because the chart internals were not restructured.

## Alias and tooling notes

- Path aliases in `tsconfig.json` follow the tiers: `#/atoms`, `#/molecules`,
  `#/organisms`, `#/lib`, `#/hooks`, `#/utils`. The `#/components` and `#/ui`
  aliases were removed with the folders they pointed at.
- `components.json` (the shadcn CLI) writes to `#/atoms`, which is where the
  primitives live, so `bunx shadcn add` still lands in the right place.
