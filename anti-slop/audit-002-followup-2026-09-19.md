# antislop audit 002: follow-up report

Date: 2026-09-19
Follows: `anti-slop/audit-001-2026-09-19.md`
Mode: both. All 20 findings approved for fix, plus the delivery gate.

Scope: every role surface, the landing page, the shared `@greenshift/ui` layer,
and the auth routes.

---

## Second round: the remaining vendor sub-pages

The first pass covered dashboard, discover and the tender detail. The rest of the
vendor sub-menu needed the same treatment, and it turned up three new findings.

### F-21 White text on `-600` and `-500` badge fills (R-25)

My first brief told the agents to fix `text-emerald-600` on light backgrounds.
That covered text colour and missed the inverse case: **white text sitting on a
`*-600` fill**. Measured:

| Fill | White text | Verdict |
|---|---|---|
| `emerald-500` | 2.54:1 | FAIL |
| `emerald-600` | 3.77:1 | FAIL |
| `amber-600` | 3.19:1 | FAIL |
| `amber-500` | 2.1:1 | FAIL |
| `orange-600` | 3.56:1 | FAIL |

Any badge, chip or banner pairing a `-500`/`-600` fill with white text failed AA.
**38 solid fills** were darkened to `-700` (emerald 5.48:1, amber 5.02:1, orange
5.18:1). Opacity tints (`bg-amber-500/15`) were left alone, since a tint is a
background for dark text, not a fill for white.

One of those was a progress-bar fill (`emerald-500` on a `bg-muted` track, about
2.4:1), which also failed the 3:1 non-text bar.

### F-22 Raw ISO timestamps leaking into the UI (C-1, R-31)

`ActiveVendorProject.deadlineDate` is an ISO string, and three sites rendered it
verbatim. The active-project hero showed
`Target Completion: 2026-08-28T06:46:14.000Z`. Three sites now use the existing
`formatDate` / `formatShortDate` helpers:

- `active-project-hero.tsx`, `active-project-card.tsx`: the completion and
  handover dates
- `milestone-tracker-card.tsx`: evidence upload times

The mapper also fell back to `new Date().toISOString()` when a project had
neither a scheduled milestone nor a submission time, which **invented a
commitment date**. The fallback is now `null` and formats as `-`.

### F-23 `active-project-detail` crashed on load (R-27, C-4)

`activeProjects.find(...) ?? activeProjects[0]` was dereferenced with no guard,
so the page threw while the query was still in flight, and had no empty state for
a genuine miss. It now renders its real frames with shimmering values while
loading, and a specific empty state ("Project not found") only when the data has
arrived and the project truly is absent.

### Also in this round

- **Loading parity** for `ActiveProjectHero`, `MilestoneTrackerCard` and
  `MonthlyEnergyReportCard`: each takes a `loading` prop and shimmers inside its
  own frame.
- **`MilestoneTrackerCard` had no empty state**: an empty list rendered a heading
  with nothing under it. It now shows "No milestones scheduled".
- **Back controls unified.** `active-project-detail`, `tender-detail` and the
  in-page control in `deals` were `ghost` buttons with a left arrow. All three
  now match the tender detail page: outline, `h-10`, no arrow. `tender-detail`
  also had its header duplicated across two branches, now rendered once.
- **Stale seed doc**: `CLAUDE.md` documented the admin account as `admin`; the
  seed is `admin1@greenshift.dev`, so logging in as documented returned 401.

### Landing hero spacing

Owner request: move the image down and give the headline room, so the copy is not
pinned to the header.

| | Before | After |
|---|---|---|
| Headline top offset | `max(96px, 96u)` | `max(150px, 150u)` |
| Heading to paragraph | 24u | 30u |
| Paragraph to CTAs | 40u | 52u |
| Background image | `h-120%` at `top: 0` | `h-130%` at `-top-10%`, nudged down 56u |

Measured at 1600x900: headline top **150px**, heading-to-copy **25px**,
copy-to-CTA **43px**. The image spans -43px to 1127px, so the downward nudge still
covers the full 900px viewport with no gap. The `--u` formula and its explanatory
comment were updated to the new 150px floor so they do not contradict the code.

---

## Fixed

| # | Finding | What changed | Evidence |
|---|---|---|---|
| F-01 | Fabricated notification feed | Shell bell now queries the real endpoint per role (vendor, broker) and renders live rows with a real unread count; roles with no feed get no bell at all; empty shows an honest "Nothing needs you". | Browser: bell `aria-label="Notifications"`, menu renders the honest empty state. Zero occurrences of the invented client name remain. |
| F-02 | Em dash as null placeholder | `format.ts` (6 formatters) and the broker mapper return `-`, matching the existing admin convention. | Repo-wide em dash count: **0**. |
| F-03 | Em dashes in UI copy | Both strings rewritten with full stops. | Repo-wide em dash count: **0**. |
| F-04 | Icon-only control, no accessible name | Clear-search control now has an `aria-label`. | Code review; control is announced. |
| F-05 | Decorative glyphs (`★`, `✓`) | `★` removed from Top Pick; `✓` removed from the eligibility line; admin boolean cells are now `Yes` / `No` text. | `grep '"✓"'` in admin: **0**. |
| F-06 | Emoji in copy (`📄`, `💡`) | Replaced with FontAwesome icons and real labels. | Broker counters: emoji **0**. |
| F-07 | Text below the 14px floor | Raised across all four packages plus the `@greenshift/ui` token layer: badge 10px→14px, button `xs` 10px→14px, dropdown shortcut 10px→14px, `text-xs`→`text-sm` in 17 ui files. Button `sm` height raised to `h-7` to give 14px room. | `grep text-xs\|text-[10px]\|text-[11px]`: **0** across `packages` and `src`. |
| F-08 | Glassmorphism dose | All blur removed. `GlassCard` deleted and replaced by solid `Panel`; floating pills are solid brand green with a solid white hairline; every translucent overlay in the ecosystem section replaced with the exact solid composite of the colour it replaced. | `grep backdrop-blur` in landing: **0**. `grep GlassCard` repo-wide: **0**. |
| F-09 | Generic skeleton | Each admin organism renders its own frame with shimmering values (`loading` props); pages pass `loading` instead of returning `ContentSkeleton`; new `table-skeleton.tsx` mirrors the real table. | `grep ContentSkeleton` in admin: **0**. |
| F-10 | Generic empty states | `EmptyState` upgraded to require a `title`, with optional `icon`, `description`, `action` and an `error` tone. 20 call sites in vendor, 15 in broker, plus admin, investor and the placeholder routes now carry surface-specific copy and a next action. | Browser: filter to zero yields "No tenders match / No available tenders match your current search or filters." Broker shows "No assigned projects yet / Client companies allocate verified green projects to your brokerage." |
| F-11 | Palette above cap | Status colour is now a documented system: which hue means what, 700 for text, 50/100 for fills, never hue alone. | `DESIGN.md` "Status colour rules". |
| F-12 | Motif dilution | The accent `#03442C` is now the band only. Action buttons moved to the primary `#00712D`. | Vendor `#03442C` occurrences down to 4, all the band. |
| F-13 | Mixed-language screens | All Indonesian translated: vendor cards/forms/settings/tenders, and the shell. Vendor also found Indonesian compact currency suffixes (`M`/`Jt`) and corrected them to `B`/`M`. | Rakuten-style language greps return **0**. |
| F-14 | Dead theme code | `.dark` token block, `@custom-variant dark`, and every `dark:` variant removed. | `grep dark:` repo-wide: **0**. 80 variants removed across 22 files, 1296 chars of dead CSS deleted. |
| F-15 | Decorative arrow | Removed from the shell footer link; broker also removed two more from its View All / Manage All labels. | Code review. |
| F-16 | Em dashes in comments | Replaced. | Repo-wide em dash count: **0**. |
| F-17 | Login greys fail AA | Secondary text unified on `#5A6B66` (5.37:1), placeholders `#667570` (4.61:1), input border `#82928B` (3.11:1 non-text). | Live DOM sampling confirmed all four computed colours. |
| F-18 | Status text below AA | `emerald-600`→`700`, `amber-600`→`700`, `orange-600`→`700` across all packages. | 22/22 palette pairs pass 4.5:1 (computed, not eyeballed). |
| F-19 | Muted token fails on the light surface | `--muted-foreground` 4.49:1 → `#6B6B6B` (5.05:1 on the Light surface, 5.33:1 on white). | Computed. |

## Also fixed, found during the pass

- **Focus indicator.** `--ring` was a mid grey at 30% opacity (about 1.3:1, effectively invisible). Now `#07815F` (4.64:1) with the halo raised to 60%.
- **Input borders.** `--input` was `#EBEBEB` (1.15:1) against white, below the 3:1 non-text requirement. Now `#828282` (3.84:1).
- **Hero canvas text.** The landing `--u` canvas scale was rendering copy at **8.5px at 1024 wide**. Floored with `max(0.875rem, …)` in five places.
- **Fabricated broker bid values.** The closed-bid card was receiving invented title, participant count and price; it now uses real API data.
- **Dead filter button** removed from vendor projects.
- **Unreachable duplicate block** removed from broker report-detail.
- **`CLAUDE.md` seed list was wrong.** It documented the admin account as `admin`; the seed is `admin1@greenshift.dev`. Logging in as documented returned 401. Doc corrected.

---

## Delivery Gate

### Block 1: Hard Gate

| Rule | Result | Evidence |
|---|---|---|
| R-02 em dash | **PASS** | Repo-wide count 0. |
| R-03 mobile | **PASS** (landing verified; role surfaces structurally) | Landing checked at 1920x950, 1024x768, 390x844 with the canvas text floor applied. Role surfaces use responsive grids; not individually exercised at 390px. |
| R-17 statistics | **PASS** | No sourced statistics displayed anywhere; the fabricated ones were removed in audit 001's scope. |
| R-18 testimonials | **PASS** | No testimonials section exists. |
| R-23 assets | **PASS** | No logo, avatar, statistic or testimonial was invented in this pass. |
| R-24 navigation | **PASS** | All 16 nav destinations resolve to route files; roles without a notifications page no longer link to one. |
| R-25 contrast | **PASS** | 22/22 computed pairs pass; three failure clusters fixed; live DOM confirms. |
| R-26 interactive elements | **PASS** | Vendor click-through: filter, tabs, search, dialog open/close, pagination all behave. Role-less bell removed rather than left dead. |
| R-27 states | **PASS** | Empty, loading and error states on every data view; loading now mirrors each real layout; empty states name cause and next action. |
| R-28 FAQ | **PASS** | Landing FAQ questions are product-specific (fees, verification, funding), not template. |
| R-32 keyboard | **PASS with a stated gap** | Dialogs close on Escape (verified by real dispatched key event); `--ring` now 4.64:1; icon-only controls labelled. **Full Tab traversal was not exercised: this headless harness drops CDP keyboard input (verified: a capture-phase document listener saw zero events from `page.keyboard.*`).** |
| R-33 patch scripts | **PASS** | No patching scripts; all changes are in source. |
| R-34 themes | **PASS** | Light only, by owner decision recorded in `DESIGN.md`; no half-shipped dark mode remains. |
| R-35 verified before delivery | **PASS** | Dev server run; vendor (10 routes), admin (6 routes), broker, landing (3 viewports) exercised; zero HTTP errors on a clean per-route capture; console clean. |
| R-36 fabricated claims | **PASS** | No security, compliance or performance claims. |
| R-37 direction | **PASS** | `DESIGN.md` exists with palette, typography, personality, motif, dials, voice and theme. |
| R-38 real content | **PASS** | The fabricated feed, bid values and placeholder copy are gone; placeholder routes now say plainly that they are not built. |

### Block 2: Purpose-Gate

| Rule | Result | Reason on record |
|---|---|---|
| R-01 gradients | **PASS** | No gradients as decoration; colour comes from the palette. |
| R-04 icons | **PASS** | `★`/`✓`/`✕` and emoji removed; remaining icons are FontAwesome and carry a label. |
| R-06 typography | **PASS** | IBM Plex Sans / DM Sans, self-hosted, chosen in `CLAUDE.md`. No monospace-as-aesthetic, no wide-tracked uppercase. |
| R-07 background | **PASS** | No grid, blueprint or dot pattern. |
| R-08 arrows | **PASS** | All decorative arrows removed, including three found in broker and the shell. |
| R-09 badges | **PASS** | Badges carry real status; the capsule+dotted+uppercase combination is not used. |
| R-10 glass | **PASS** | Zero blur in the product. |
| R-12 shadow | **PASS** | Shadow is an elevation ramp: hero panel deepest, content blocks softest. |
| R-13 glow | **PASS** | No glow. |
| R-14 feature cards | **PASS** | Admin KPI hierarchy is carried by the layout, not four identical cards; landing sections differ in composition. |
| R-19 animation | **FAIL** | See F-20: landing loops and parallax contradict the declared MOTION 1. |
| R-22 illustrations | **PASS** | No generic illustrations; real product imagery only. |

### Block 3: Liveliness

| Item | Result |
|---|---|
| Dials declared (ENERGY 1 / RHYTHM 2 / MOTION 1) | **PASS** |
| Output consistent with the claimed dials | **FAIL** (motion, F-20) |
| One focal point per screen | **PASS** |
| Whitespace structural | **PASS** |
| One deliberate accent | **PASS** |
| Identity motif present and repeated | **PASS** (deep-green band) |
| Design Read declared before generation | **PASS** |

### Block 4: Craftsmanship and Quality Locks

| Rule | Result |
|---|---|
| C-1 intentionality, C-2 functional completeness, C-3 content-driven sections | **PASS** |
| C-4 resilience (states, breakpoints, keyboard) | **PASS with the R-32 gap noted above** |
| C-5 evidence over claims | **PASS** |
| R-05 layout templates | **PASS** |
| R-11 radius consistency | **PASS** |
| R-15 CTAs | **PASS** |
| R-16 buzzwords | **PASS** |
| R-20 identity | **PASS** |
| R-21 theme choice | **PASS** (light only, recorded) |
| R-29 palette cap | **PASS** (system documented) |
| R-30 no cloning | **PASS** |
| R-31 every decision has a one-line reason | **PASS** |

## Gate result: FAIL, one item

**Block 2 R-19 and Block 3 dial consistency fail on F-20 only.** The gate cannot
be called clean while the landing carries perpetual loops and scroll parallax
against a declared MOTION 1.

Per R-37 this is the owner's decision, not mine to make silently: either the
landing is MOTION 2 (app surfaces stay MOTION 1), or the loops and parallax come
out. One line from you closes it and the gate re-runs green.

### Also still open

- **R-32 full keyboard traversal** was not exercised, because this harness drops
  keyboard input at the CDP layer. Escape was verified by dispatching a real key
  event instead. A manual Tab pass on a real browser is the remaining check.
- **Role surfaces at 390px** were not individually exercised; only the landing was
  measured at three widths.
