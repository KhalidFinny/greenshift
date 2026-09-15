# Agent UI Rules

Strict rules for all UI work in this project. Read on every session startup.

## Components

- **Use `@greenshift/ui` shadcn components AS-IS**: Card, Badge, Button, Table, Dialog, Select, Tabs, etc. Never hand-roll div-based components when a ui component exists. **NEVER modify packages/ui/ components**: the user built the design system. Use it exactly as it is.
- **Components are react-aria based**: use `onPress` not `onClick` for Button. Use `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` for dropdowns, not native `<select>`.
- **Import from `@greenshift/ui`**: check `packages/ui/src/index.ts` for the full export list before building anything.

## Typography

- **Minimum 12px (`text-xs`) for all visible text.** No text below 12px.
- **One font: DM Sans.** Do not use `font-heading`, IBM Plex Sans, or any other font family. The project's `--font-sans` is DM Sans; it's the only font.

## Icons

- **Use Font Awesome**: `@fortawesome/react-fontawesome` + `@fortawesome/free-solid-svg-icons`.
- Install: `bun add @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core`
- Import pattern:
  ```tsx
  import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
  import { faUsers, faBuilding, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
  ```
- Render: `<FontAwesomeIcon icon={faUsers} />`
- **Stat cards must have icons.** Big, prominent, not decorative afterthoughts.
- **Every interactive element that can have an icon should have one.** Buttons, nav items, section headers.

## Actions

- **Use `<Button>` for all interactive actions.** Never bare `<a>` links for actions. `Link` from TanStack Router is acceptable only for navigation (page-to-page), not for in-page actions.
- **No refresh/reload buttons** on dashboards. Data loads on mount. If the user wants fresh data, they navigate away and back.
- **Consistent border radius**: the design system uses `rounded-none` on buttons (via CVA). Do not add arbitrary `rounded-xl` or `rounded-lg` to buttons. Cards use the Card component's own styling. Do not mix radius conventions.

## Layout

- **Desktop-first.** Design for wide screens first, adapt down.
- **Tables for data lists.** Use the ui Table component for any tabular data. Not ring charts, not progress bars, not cards. Use tables with columns.
- **Checklist columns**: for onboarding/status tracking, use ✓/- characters in table cells, not separate chart visualizations.
- **Statistics charts, not operational tracking.** Charts show money in/out, project counts, trends. Don't chart "is the user done" or payment status breakdowns; that's operational, not statistical.
- **Primary data on top.** User/accounts table goes near the top of admin dashboards, not buried at the bottom.

## Styling

- **Bind to design tokens.** Use `bg-card`, `border-border`, `text-muted-foreground`, `text-primary`, `bg-muted`, etc. Never hardcode hex colors, `gray-200`, `bg-white`, or Tailwind color literals.
- **Exception: brand colors**: `#03442C` (dark forest green) and `#00712D` (primary green) from the project palette may be used inline as one-off accents for signature elements. Document why.
- **No `text-xs` or `text-sm` in content.** Minimum `text-base` (14px).
- **Tabular numbers**: `tabular-nums` on all dynamic numbers (counts, currency, percentages).
- **No decorative gradients.** Color communicates meaning (status, action), not decoration.

## What NOT to do

- Do NOT hand-roll components that exist in `@greenshift/ui`.
- Do NOT use `text-xs` or `text-sm` for visible content.
- Do NOT mix fonts (DM Sans only).
- Do NOT use hugeicons; use Font Awesome.
- Do NOT add "Muat ulang" / refresh buttons to dashboards.
- Do NOT use bare `<a>` for actions; use `<Button>`.
- Do NOT chart operational status (payment completion, user verification progress) as pie/ring charts; put that data in tables.
- Do NOT add arbitrary border-radius; use the system (rounded-none for buttons, Card component for cards).

## File locations

- UI components: `packages/ui/src/components/ui/`
- UI exports: `packages/ui/src/index.ts`
- Design tokens: `packages/ui/src/styles.css` (CSS variables)
- Role packages import from: `@greenshift/core`, `@greenshift/ui`, `@tanstack/*`, `@fortawesome/*`
- Shadcn config: `packages/ui/components.json`
