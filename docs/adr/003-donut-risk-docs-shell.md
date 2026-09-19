# ADR 003 — Live Donut, Derived Risk, Upload Docs, Shell Stays

Status: accepted (2026-09-09, grill Rounds 1–2; Section C revised per user direction).

1. "Emission Reduction Target Summary" donut: `PieChart` + `PieSlice` donut
   (the `portfolio-donut-card.tsx` pattern) — NOT a raw `RingChart`.
   Live value: Section C `targetReduksi %` when valid 0–100,
   45% mock fallback when empty. Metric details: baseline
   (consumption × factor), absolute target, delta. Exception rationale for
   the "don't chart operational status" rule (`agent.md`): this is a
   statistical target, not an operational checklist.
2. "Risk Preview" is derived, not static: Financial from annual cost
   (>5B = High, >1B = Medium), Technical from consumption,
   Implementation from document completeness + tightness of the year parsed
   out of the quarter input (e.g. Q1 2026 → 2026).
   Empty = `outline` "Not yet filled" badge.
3. "Prepared Documents": interactive checklist, each row with an
   Upload button (`<input type=file>`, local filename state only,
   no backend in this pass) + Done/Missing badge + remove.
4. Shell: `RoleShell` keeps its `w-64` sidebar + system topbar (no fork).
   The mock's "Butuh bantuan?" ("Need help?") card lives IN the sidebar
   via an opt-in `helpCard` prop, bottom of nav above the footer
   (reversal of the earlier Round 1 call, per user direction 2026-09-19:
   business route passes `helpCard`, all other roles render byte-identical
   with the default `false`). `roleNav.business` holds both
   "Ajukan Proyek" and "Proyek Saya" items so the system green active
   state marks each page. Header title (2026-09-19, grill Round 15:
   business-only prop): `showHeaderTitle` defaults true; the business
   route passes false so the top bar keeps only the bell. Other roles
   unchanged. Page headings in content remain the single title source.
   sidebar bottom groups help card + profile footer in
   `flex flex-col gap-4 mt-auto` with the row as a clickable
   `flex items-center gap-3 p-2 hover:bg-foreground/5 rounded-lg
   cursor-pointer w-full` (avatar + name/subtitle + chevron, token hover
   — the brief's gray-100 declined). Menu opens upward
   (`bottom-full mb-2`). Applies to every role; shell stays one
   component. Profile contrast (2026-09-19, grill Round 14, literal spec
   surface): the account button sits in `bg-white rounded-xl shadow-sm
   border border-gray-100 p-3` — literal classes per explicit user order,
   breaking the token rule by direction. Row keeps `items-center`
   alignment of avatar, name/subtitle, chevron. Scroll-lock (2026-09-19,
   grill Round 10, hardened): html/body/#app `height:100%;
   overflow:hidden` kills the layout scrollbar; wrapper is `fixed inset-0`
   so the shell ignores visual-viewport scroll drift. Single inner content
   box owns `overflow-y-auto overscroll-contain` (+ `min-h-0`, `pb-20`).
   Post-fix at max inner scroll: aside top 0, bottom 768 = viewport.
   The brief's `bg-gray-50` / `w-1/5` / flat-scrolling-main were declined
   — tokens and the shared 256px rail win.
5. Wizard: Step 1 is front-only — local validation, then a "Draft saved,
   continue to Step 2" message. No POST/backend. Stepper placeholder names
   below are SUPERSEDED by ADR-006 (COMPANY names). Section C timeline is
   a native `<select>` (12 rolling quarters, 3 years from January of the
   current year) styled like the old input (`h-10`, `bg-input/20`,
   rounded border, `pl-9` under the absolute calendar icon, native arrow
   via `appearance-auto pr-8`). Native — not ui `Select` — per explicit
   user order (Round 11); values are always valid quarters so the
   `/^Q[1-4]\s+\d{4}$/i` validator is now a backstop. Section D
   textarea 50–1000 characters + counter + green "Submit & Lanjut"
   bottom-right.
