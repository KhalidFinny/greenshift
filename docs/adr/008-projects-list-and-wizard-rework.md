# ADR 008: Projects list and submission wizard rework

Status: accepted (2026-09-20, owner request).

Covers two business surfaces: the project list at `/business/projects`
(`packages/business/src/my-projects.tsx`) and the four-step submission wizard at
`/business/submit` (`packages/business/src/submit.tsx` plus
`packages/business/src/views/step-{2,3,4}.tsx`).

## 1. Project list

1. The table stays the shared `DataTable`
   (`packages/ui/src/components/ui/data-table.tsx`), which is TanStack Table
   with sorting, the global search field, and the shared pagination footer. No
   page hand-writes rows, headers, or a pager, and there is no second table
   implementation. Two small additions to the shared component: the empty-cell
   message wraps instead of widening the table, and the pagination footer renders
   only when the table has at least one page (an empty table printed
   "Page 1 of 0" under a message that already said the list was empty).
2. Filters are page-level state, the convention already used by the admin
   tables (`packages/admin/src/pages/projects.tsx`): two `Select` controls over
   the rows the API returned, then a `useMemo` before `DataTable`. Status options
   come from the statuses present in the loaded rows and sector options from the
   distinct non-null sectors, so a filter can never offer a value the list does
   not contain. The selects are disabled while there is nothing to filter.
3. The page title and description are gone. The page opens with one toolbar row:
   filters left, "Submit a Project" right.
4. Empty states stay distinct: no projects at all keeps the empty state that
   points at the wizard, and a filter that matches nothing says so and names the
   reset.
5. Below `md`, Submitted and CAPEX fold into the project cell's muted line and
   their columns are hidden through the `DataTable` column `meta` classes, and
   the two row actions stack at 44px. The table then fits a 390px viewport with
   no sideways drag (audit F-38, R-03).

## 2. Wizard shell

6. The page title and the per-step subtitle block are gone. The wizard's own
   header is the first child of the wizard root and is the only sticky element:
   `sticky top-0 z-20 -mx-4 sm:-mx-6` with its own horizontal padding, which
   spans the content edge to edge inside the shell's scroll container
   (`role-shell.tsx`). Row one is the four-step strip with the active step named;
   row two is the action bar: draft save state on the left, Back and the step's
   primary action on the right. The old bottom action row is deleted, and the
   primary action (Save & continue, or Submit the Project on step 4) exists only
   in that bar. A horizontal connecting line sits behind the step circles at
   desktop (`sm` and up), giving a visual progress rail without vertical
   dividers.
7. All four steps stay visible at 390px, so the progress read-out is never
   hidden behind a horizontal scroll (F-37). On mobile the circles are shown
   without their labels; the active step's name appears beside the circles on
   the same line.
8. The active step is painted with `--primary` tokens, never a literal hex or an
   inline `style` (F-31, F-36), and every interactive element keeps a
   full-opacity focus ring (`ring-2 ring-ring`, not a fractional one; F-27).

## 6. Shell header seam

19. The scroll container in `role-shell.tsx` originally carried `pt-6 sm:pt-8`
    padding, which created a 24/32px gap between the shell header and the
    wizard's sticky bar. A child's negative margin cannot cancel this padding
    because CSS margin collapsing through a block formatting context shifts the
    parent's border box without moving the child's static position. The fix:
    the padding is moved from the scroll container into an inner `flex flex-col`
    wrapper (`pt-6 sm:pt-8`). Flex formatting contexts do not collapse margins,
    so the wizard root's `-mt-6 sm:-mt-8` now shifts the root (and its sticky
    header child) up to the shell header's bottom edge. Verified at 390px and
    1440px, at rest and while scrolled: the gap is 0 and the bar pins at
    `data-shell-header`'s bottom.

## 3. Wizard forms

9. The wizard is one TanStack Form instance: `useProjectWizardForm()` in
   `packages/business/src/lib/use-project-wizard-form.ts` holds the three data
   steps plus the two declarations, so a resume seeds every step at once and
   every view reads the same values.
10. Fields render through the shared bundle in
    `packages/ui/src/components/form/form.tsx`, extended with `NumberField`
    (optional `prefix`/`unit`), `TextareaField`, `SelectField`, and
    `CheckboxField` beside the existing `TextField`/`PasswordField`. Each one
    owns its label, its message (`role="alert"`) and its aria wiring, so every
    control in the wizard has one height and one label/helper/error rhythm.
11. Messages come from exactly one place. `lib/validators.ts` stays the rule set
    and `lib/wizard-rules.ts` is the only bridge from form values to it, for the
    inline per-field messages and for the step gate alike. No message string is
    restated in a component.
12. Validation is per field on change, so a pristine form shows no errors and a
    field only speaks after the user has touched it. Save & continue keeps the
    older behaviour deliberately: it surfaces every message for the current step
    at once, so the user sees the whole picture for that step when they ask to
    move on. Step gating (Step 1 and Step 2 must validate, Steps 3 and 4 do not,
    Back never validates) is unchanged.
13. Numeric entries stay the strings the user typed, so a resumed value is shown
    through `formatField` in Indonesian grouping rather than as a raw number
    (F-33). Conversion happens where the payload is built.
14. The location combobox stays bespoke and business-owned: it searches the
    bundled district list and carries its own loading, error, and
    "100 of N" states. It is bound to the form field rather than reimplemented as
    a generic control.
21. Each step is one view file (`views/step-1.tsx` … `views/step-4.tsx`), and the
    shell (`submit.tsx`) owns only the wizard state, the draft and the derived
    figures, composing `views/wizard-header.tsx` with the four views. The wire
    mapping moved to `lib/wizard-payload.ts` (autosave blocks, resume values,
    resumed files) and the Step 1 tones to `lib/project-risk.ts`
    (`step1RiskTones`), so the field names the API expects and the tone
    thresholds each live in one place. The views take the form instance and
    report file changes back; none of them builds a payload.

## 4. Sections instead of card stacks

15. Form sections flow on the page background: an `<h2>` with an optional one-line
    helper and the fields in an aligned grid, separated by spacing rather than
    frames. This is `DESIGN.md`'s "cards wrap data, not sections" rule, and it is
    what removes the card-inside-card nesting the wizard had. A card is kept only
    where the content is a discrete unit: the emission-reduction donut, the risk
    preview, the credit score, a document list, an info note.
16. Step 1's rail holds two cards: the donut summary and the risk preview, whose
    three tones are full-width rows (icon, label, badge) rather than a
    three-column box grid. "Documents to Prepare" moves into the middle column as
    the step's last section.
17. Icons mark actions, not headings: upload, remove, and the chart affordances
    keep their glyphs, section headings do not.

## 5. Draft autosave payload (fixes F-24/F-25)

18. Autosave honours the patch semantics `use-business-draft.ts` already
    documents: only fields the user actually filled are sent, a field the user
    cleared after having a value is sent as `null`, and an untouched field is
    omitted. The previous effect sent every key on every keystroke, including
    `lokasi: ""` and `sektor: ""`, which the server reads as present-but-empty and
    rejects with 400, retrying on each debounce tick and spending the mutation
    budget. Step number, debounce, call site, and the rest of the payload shape
    are unchanged.
20. The resume returns the draft's files alongside the draft
    (`BusinessDraftResumeResponse.documents`, `BusinessDraftDocument`), because
    the stored blocks reference them by id only: `step2.fileIds` and
    `step3.docStates` name files that a resumed screen otherwise cannot render.
    The upload response carries the same shape (`id`, `slot`, `fileName`,
    `sizeBytes`, `uploadedAt`) instead of the project-document shape, whose OCR
    state a draft file does not have yet; OCR starts when submit promotes the row
    into `project_documents`. Without this, a reloaded Step 2 counted a document
    toward the score while its list showed none.

## Supersedes

- ADR-003 items about the Step 1 card stack and the step strip's colours and
  markup.
- ADR-004, ADR-005: the section frames become page-background sections; the field
  set, rules, and copy are unchanged.
- ADR-006 items 1 (stepper as a page element), 5 (right-rail submit card) and 6
  (bottom nav): the strip moves into the sticky header, and the primary action
  moves into the action bar. ADR-006.7's risk section, dialog, and derivation
  rules stand.
- ADR-007: the list's title block and its hand-managed presentation; the
  `DataTable`, filter, and mobile decisions above replace them.
