# GreenShift Design Direction

Fields only. Palette and typography are transcribed from `CLAUDE.md`; personality,
motif, dials, voice, and theme are the owner's answers. Nothing here is agent-invented.

## Identity

GreenShift is an MRV (Measurement, Reporting, Verification) platform for green
financing. Bonds are sold through brokers, so the product is a working tool for
businesses, vendors, brokers, and regulators, plus one public surface (the bond
catalog) and the landing page.

Audience skews institutional: companies submitting projects, vendors bidding on
tenders, OJK-licensed SCF partners, and investors. Regulators read the same
screens as operators.

## Personality

Institutional and sober, blended with technical and precise.

- Restrained and bank-grade: low ornament, calm surfaces, no decorative energy.
- Precise: numbers lead, labels are exact, nothing is rounded off for looks.
- The result should read as infrastructure a regulator would trust, not as a
  startup marketing page.
- Implication: when a choice is between expressive and legible, pick legible.

## Palette

Transcribed from `CLAUDE.md`:

| Role | Value |
|---|---|
| Primary | `#00712D` |
| Accent | `#03442C` |
| Light | `#F8F9F7` |
| Description box | `#014A2F` |

Neutrals come from the shadcn token layer (`--background`, `--foreground`,
`--muted`, `--border`, `--card`), which resolves to near-white and near-black.

Status colours in use: emerald (positive), amber (attention), red (negative),
blue (informational), purple (invitation-only). These read as semantic status,
not as brand colour.

### Status colour rules

Status colour is semantic, not decorative. Four rules hold it to a system:

1. **Text always uses the 700 shade** on a light background. The 600 shades fail
   WCAG AA at normal text size (`emerald-600` is 3.77:1, `amber-600` 3.19:1,
   `orange-600` 3.56:1 against white). The 700 shades all pass: emerald 5.48:1,
   amber 5.02:1, orange 5.18:1, red 6.47:1.
2. **Fills use the 50 or 100 shade** of the same hue, so a chip reads as one
   object. Verified text-on-tint ratios: emerald 5.21:1, amber 4.84:1, orange
   4.88:1, red 5.30:1.
3. **One meaning per hue.**

| Hue | Means | Example |
|---|---|---|
| emerald | positive, verified, matched, on track | match score, verification, carbon target |
| amber | attention, approaching, moderate | deadline within 7 days, medium risk |
| red | negative, urgent, failing | deadline within 3 days, high risk, errors |
| blue | informational, neutral state | open bidding, in progress |
| purple | invitation only, restricted access | direct selection |

4. **Never carry meaning by hue alone.** Every status pairs its colour with a
   word. A coloured dot, border, or bar on its own is not a status.

## Typography

Transcribed from `CLAUDE.md`:

- Headings: IBM Plex Sans
- Body: DM Sans
- Self-hosted via fontsource. No Google Fonts dependency.

Minimum body size across role surfaces: `text-sm` (14px). Nothing smaller ships.

## Motif

The deep-green band (`#03442C`).

It is the one signature device. It appears as a full-bleed or single-band surface
marking the most important region of a page, and nowhere else.

Current intended use: the tender detail hero (the single most important band on
that screen).

Motif discipline: one band per screen, acting as the focal point. Diluting it
across banners, badges, headers, and footers removes its meaning.

## Dials

```
ENERGY 1 / RHYTHM 2 / MOTION 1     (app surfaces)
ENERGY 1 / RHYTHM 2 / MOTION 1     (landing, phone)
ENERGY 1 / RHYTHM 2 / MOTION 2     (landing, wide canvas)
```

The landing carries MOTION 2 by owner decision: its loop animations and parallax
are intentional. Every signed-in surface stays MOTION 1.

**The landing is two compositions, not one that shrinks.** The wide-canvas hero is
a single rigid 1920px canvas with parallax and looping pills; squeezed into a
phone it reads as broken, so the phone gets its own composition
(`packages/landing/src/mobile`, chosen by `useIsMobile` at 768px) with its own
dial. Motion drops to MOTION 1 there: the loops exist to fill a wide canvas, and
on a phone they cost scroll smoothness and battery for no added meaning. Content
is shared (`packages/landing/src/content/landing.ts`), so the two compositions can
never tell different stories.

- **ENERGY 1** (calm): restrained. No large type for effect, no full-bleed colour
  beyond the motif band, no ornament that does not carry information.
- **RHYTHM 2** (consistent, few breaks): sections share a spacing and type scale,
  with deliberate breaks where the content genuinely changes character, such as
  the motif band or a dense table.
- **MOTION 1** (hover and state transitions only): hover states, focus rings,
  dialog open/close, list entry. No scroll choreography, no parallax, no loops.
  Anything that moves forever without a user trigger contradicts MOTION 1.
- **MOTION 2** (landing only): the hero parallax, the floating-pill float and the
  ecosystem orbit are allowed. They are the one place in the product where
  perpetual motion is the intent.

## Theme

Light only. There is no dark mode and no theme toggle. This is the owner's
decision, not an omission, so R-21's toggle requirement does not apply.

All dark-theme code has been removed: the `.dark` token block,
`@custom-variant dark`, and every `dark:` variant across the codebase. A `dark:`
class reintroduced anywhere is dead code by definition.

## Voice

English only, everywhere. No mixed-language screens.

## Surface rules

Established by the owner during the vendor surface work, recorded here so they
hold going forward.

- **Cards wrap data, not sections.** A card holds one discrete unit. Section
  headings, lists, and page-level content flow free on the page background.
- **Real buttons only.** No text-styled controls standing in for a button. Every
  action is a button component.
- **No decorative arrows.** An arrow glyph appears only where it carries a
  direction cue, never as default button ornament.
- **shadcn primitives only**, from `@greenshift/ui`. No bespoke one-off controls.
- **Two icon languages, split by layer.** Surface code draws FontAwesome icons;
  the shadcn primitives in `@greenshift/ui` keep the Lucide glyphs they ship
  with (chevron, check, close, sort). The reason: those glyphs are internal to a
  control the product adopted from shadcn, and rewriting them would put the
  primitives off the upstream they are tracked against. No meaning is carried
  twice: anything on the page is FontAwesome, a control's own affordance stays
  Lucide.

  *Recorded during the audit-003 fix pass (F-30). The owner can move or drop it.*
- **One match signal per card.** No duplicate badges competing to say the same thing.
- **Data comes from the API or it does not appear.** No fabricated rows, feeds,
  names, or numbers.
- **No glassmorphism.** No blur or translucency on content surfaces: cards,
  panels, tooltips, headers, pills, section frames.

  **One recorded exception:** the full-screen scrim behind a modal
  (`dialog.tsx`, `sheet.tsx`) keeps
  `supports-backdrop-filter:backdrop-blur-xs`. Reason: it is not a content
  surface, it is the dimming layer that takes the page behind the dialog out of
  focus, and it is progressive enhancement (browsers without support get plain
  `bg-black/80`). Removing it would cut focus contrast for no gain. Two elements
  exist, at most one visible at a time, which holds the R-10 dose cap.

## Landing page

- Hero: Green 1 (foreground) and Green 2 (background), laid out on a 1920px
  design canvas (`--u` in `styles.css`) and scaled as one rigid unit. Canvas
  scaled text is floored at 14px so narrower viewports cannot shrink copy below
  the body minimum.
- Hero dashboard: solid white `Panel`, carrying the deepest elevation on the
  page, so it reads as the focal surface.
- Floating pills: solid brand green with a solid white hairline, secondary to
  the panel.
- How It Works: horizontal timeline on solid white content frames.
- A fade-to-white bridge joins the hero to How It Works.

**Removed from the original direction:** glassmorphism, on the owner's
instruction. Every blurred or translucent content surface is now solid, using the
exact solid composite of the colour it replaced.

**Open, pending the owner (audit F-20):** the hero parallax, the mouse parallax,
the floating-pill loop and the ecosystem orbit all move without a user trigger,
which contradicts MOTION 1. Either the landing is MOTION 2, or those come out.
