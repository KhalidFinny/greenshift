# ADR 001 — System Tokens vs. Visual Mock (Ajukan Proyek)

Status: accepted (2026-09-09, grill Round 1: `design_tokens` → tokens + DM Sans).

Decision: build the dashboard with tokens from `packages/ui/src/styles.css`
(`bg-card`, `border-border`, `text-muted-foreground`, `text-primary`, `bg-muted`)
and the single font `--font-sans` (DM Sans Variable). The `agent.md` bans are
obeyed: no `bg-gray-50`/`bg-white`/`teal-700`/hex literals in page code.
Inline `#00712D` is used in exactly two places — the stepper dot and the
achieved donut slice — documented here as the exception. The Submit button
stays green via the `Button` default `bg-primary` token, which needs no exception.

Context: `COMPANY.md` asked for Inter + `bg-gray-50` + `teal-700/green-800`
for a pixel-perfect match with the mock. `agent.md` + `styles.css` forbid that.
The grill picked the system: the mock is a proportion/hierarchy reference,
not literal colors/fonts. The donut uses `var(--chart-*)` + `#00712D` for the
achieved slice.
