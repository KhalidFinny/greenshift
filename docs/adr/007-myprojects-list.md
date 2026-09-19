# ADR 007 — MyProjects List Page (Proyek Saya)

Status: accepted (2026-09-19, grill Round 6).

New `MyProjects.tsx` page in `packages/business` as the sibling of the
wizard, per the four grill calls.

Contrast fix (2026-09-19, grill Round 7: `color_rule/match_verified/
pill_shape` → in-system / dot-plus-check / repo-precedent): Review LVV
keeps `secondary` pill but its dot darkened #f59e0b → #b45309 (the old
amber-on-gray failed contrast); Verified dot darkened #16a34a → #15803d
and gains a check icon so it no longer twins with Matchmaking; all pills
sized `!h-8 rounded-md px-3 text-base` per the admin/investor table
precedent.

OVERRIDDEN 2026-09-19 by explicit user direction (Round 8): the status
cells now use literal `bg-yellow-100 text-yellow-800` /
`bg-blue-100 text-blue-800` / `bg-green-100 text-green-800` pills with
`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
border-0` (plain `<span>`, no `Badge` variant). This breaks ADR-007.3
and the `agent.md` token rule by user order; the Round 7 fix was rejected
as still unreadable.

1. Route (grill `route_shape` → list at /business/proyek): new file
   `src/routes/_auth.business.proyek.tsx` rendering the list; wizard
   keeps `/business` as "Ajukan Proyek". `roleNav.business` gains a
   second item `{ to: "/business/proyek", label: "Proyek Saya" }` so the
   shared `RoleShell` marks it active (system `bg-primary`, no fork).
2. Data (grill `table_data` → demo rows): static rows in
   `packages/business/src/lib/my-projects.ts` (3 rows covering
   Review LVV / Matchmaking / Verified: name, location, sector,
   tanggal pengajuan, CAPEX) — same pattern as admin `demo-data.ts`.
   Real API replaces it later; no backend in this pass.
3. Status pills (grill `status_badges` → system pills + dots): `Badge`
   variants stay in-system (`secondary` Review LVV, `default`
   Matchmaking/Verified) with a colored status dot (amber/primary/green
   data-ink). No yellow/blue/green pill literals — `agent.md` color rule.
4. Actions (Round 11: `risk_data` → demo-per-status, Detail → wizard):
   Detail is a link button to `/business`; Risk Assessment opens a
   controlled `Dialog` reusing Step 4's `RiskAssessmentBody`, fed by
   `demoRiskForStatus()` — fixed representative tones per status run
   through the real `projectRisk()`, dialog labeled "data contoh".
   Download (Round 12: `icon_set/alert_call/hover_style` → FA / real
   download / system ghost): icon-only `ghost icon-sm` button with
   `faDownload` + per-row `aria-label`, triggering a real client-side
   summary download (`projectSummaryText` + Blob anchor, offline-safe).
   No lucide import, no `alert()`, no gray-100 literal — all three spec
   asks declined in favor of system equivalents.
5. Surfaces: header + subtitle + primary "Ajukan Proyek Baru" (top
   right, navigates to the wizard); ui `Table` inside a `Card`
   (token substitute for the brief's white rounded-xl shadow card).
   Numbers `tabular-nums`, DM Sans, tokens only.
