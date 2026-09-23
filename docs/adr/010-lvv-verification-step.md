# ADR 010: The project summary, and verification as the company's own step

Status: accepted (2026-09-23, owner request).

## Context

Two surfaces had drifted into two renderings of one case: the wizard's review
step (`packages/business/src/views/step-4.tsx`) showed the project's financial
case, its document status and its risk assessment, and the project's own page
(`packages/business/src/project-record.tsx`) showed a thinner record of its own:
a figures card, a flat document list and a risk section. The figures were
computed twice, in two components, with the ROI forecast and Eleanor's readings
assembled in one place and absent from the other.

Verification was also the platform's move rather than the company's: submitting a
project started a timer that ran the LVV review and cleared the project into
matchmaking, and the legal/technical document pack the wizard collects appeared
in the record as if it were the project's own file set.

## Decision

**1. One summary, two surfaces.** `packages/business/src/views/project-summary.tsx`
now owns the summary: A (project and financial summary, ROI forecast included),
B (file status) and B2 (risk assessment). The review step renders it from the
form, the project's own page renders it from the stored record, and only the
framing differs (`context: "review" | "record"`). A figure that changes shape
under one surface cannot drift from the other, and the Green Project Blueprint,
which is generated from the same engine and the same figures, has one summary to
agree with.

The wizard keeps what belongs to a submission and not to a record: section C, the
two declarations submit is gated on.

**2. The project's page is the summary and the blueprint it becomes.** The
record also renders the Green Project Blueprint as a document
(`packages/business/src/views/project-blueprint.tsx`): the identity of the
document, the funding structure, the emission targets and the projections the
document carries, with the stage it has reached.
`GET /api/business/projects/:id/blueprint` serves it and answers with null while
there is none, because the document is written at verification. One shape,
`ProjectBlueprintView`, is read by both surfaces: the company reads its own at
whatever stage it is at, and the vendor read keeps its gate that only a
validated or published document reaches a bidder.

The projections are charted from the scenarios' own `recoveryRp` series, which
the forecast engine writes as part of each scenario: the running total of the
discounted savings against the capital, crossing zero in the year that case
repays it. The page does no arithmetic of its own on the money, so the chart
draws what the document carries rather than a second derivation of it, and the
shape it is drawn with (`LineChart`, `packages/ui/src/components/charts/line-chart.tsx`)
is a shared component like the bar and ring charts.

**3. The risk assessment is part of the record.** On the project's page it is
rendered whole (`RiskAssessmentBody`) rather than behind a "View the Risk
Assessment Detail" dialog: the page is where the assessment is read, so it is one
page. The review step keeps the dialog, where it is a preview of a submission
rather than the record itself.

**4. Verification belongs to the company.** A submission lands on a new status
`registry` (pill `Register for LVV`) instead of `assessment`, and `assessment`
now reads `Awaiting LVV verification`. The project's page carries a verification
section that stays in every state: it names the registry registration and offers
the one action that starts verification
(`POST /api/business/projects/:id/lvv` -> `assessment`). The body's verdict still
arrives out of band and clears the project into `tendering`, where the blueprint
is generated and matchmaking opens. The "Go to vendor matchmaking" routes are
offered only once that has happened.

The registration itself happens at Sistem Registri, outside the platform, so the
page reads the registry back (`GET /api/business/projects/:id/registry`, answered
by the same simulated registry the verification flow reads). A project the
registry already holds while the platform still has it on `registry` is a company
that did the first half and forgot the second, and the page says so: "Sistem
Registri already holds this project. Nothing is left to register: start the
verification here."

**5. The LVV document pack is not in the summary, and not on the record either.**
Section B of the record lists the project's own files, which is what a bidder
reads with the tender, and the verification section no longer repeats the
registry's checklist: the documents the LVV needs are filed at Sistem Registri,
by the company, where the LVV body reads them. Listing them a second time on the
record only invited a company to upload the same pack twice.

**6. Every table and list pages.** `DataTable` pages by default
(`pageSize` 10) and renders the shared `PaginationBar`; lists that are not tables
use `usePagedRows` + `PaginationBar`. Fixed-length collections are left unpaged
on purpose. Server-side paging was not introduced: the list endpoints still take
`?limit=`, and the pages page the rows they already hold.

## Consequences

- `pillStatus` labels changed: `assessment` is now `Awaiting LVV verification`, and
  `registry` is `Register for LVV`. The dashboard's "In review" metric counts both.
- The status enum gained a value (`registry`); the column is a plain `text`, so
  no migration is needed.
- `GET /api/business/projects/:id` returns the Step 2 figures as a `funding`
  block, which is what the project's page renders the summary from. The top-level
  `capexRp` moved into it.
- `GET /api/business/projects/:id/blueprint` serves the project's own blueprint,
  null included. The vendor-facing type `VendorProjectBlueprint` is now
  `ProjectBlueprintView`: one document, one shape, two readers.
- The display formatters are one set in `packages/business/src/lib/project-display.ts`:
  `formatCapex` became `formatRupiah` (its body was never CAPEX-specific) and
  gained `formatYears`, `formatPercent` and `formatTonnes`, which the summary and
  the blueprint both read.
- A project submitted before this change sits in `assessment` and is already past
  the registry step, which is the direction that reads as "in progress" rather
  than "needs you".
