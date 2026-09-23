# ADR 012 — Step 3: Scope of Work, and where a blueprint and a bid live

Status: Implemented (2026-09-23, QA batch: vendor and company surfaces)

## Context

Four defects came out of the QA pass, and they share one cause: the wizard never
collected the scope of work, so everything downstream of it had nothing to read.

1. **The company could not state what the work is.** `projects.technical_requirements`
   and `projects.deliverables` existed as columns, and the vendor's project page
   rendered them, but only the fixtures ever wrote them. A company submitting a
   project through the wizard produced a project with an empty scope, so the
   vendor read an empty list and the matching model had no vocabulary from the
   company's own statement of the work.
2. **The blueprint was gated behind verification, in words and in the API.** A
   bidder opening a tender that was already past verification read "the blueprint
   is written once LVV GRK verifies the project's figures" over an empty card,
   because the seeded procurement projects carried no blueprint row at all.
3. **A bid was filed against the wrong tender.** The submit dialog sent
   `Number(project.id)` as `tenderId`, so the API looked up whatever tender
   happened to share that id and answered `TENDER_CLOSED` for a tender whose
   deadline had not passed. The live ranking read the vendor's own nearest open
   tender rather than the one on the page, so it listed another tender's bids or
   nothing at all.
4. **A portfolio record claimed two things at once.** `vendor_portfolio_items.status`
   was `COMPLETED` or `VERIFIED` and the card showed both, but nothing in the
   platform verifies a vendor's own reference: the fixtures alternated the flag,
   and the API accepted `VERIFIED` from the client.

## Decision

**The wizard gains a third data step.** `BusinessStep3` is
`{ requirements: string[]; deliverables: string[] }`, collected as two
open-ended lists (one entry per line), stored in the `projects` columns that
already existed, and carried through the draft (`step3`), the submit body and the
review. The steps are now Profile, Financial Eligibility, Scope of Work, Review:
four screens, four payload steps. The key technical requirements join the
project's vocabulary in `matching.service.ts`, so the technical-fit criterion
reads the company's own statement of the work as well as its title and
description.

**A project past verification carries a blueprint.** The document is written from
the submitted figures at verification, which is what clears a project into
procurement, so every project a bidder can open has one. The vendor card says
which stage the document reached ("Validated" / "Validated and published") and
never promises a future display. The seeded procurement projects now carry
documents built by `buildBlueprintDocument`, the same builder the API uses, so a
fixture's blueprint is the blueprint verification would have written.

**A ranking belongs to one tender.** `GET /api/vendor/leaderboard` takes an
optional `tenderId`; a project screen passes the tender it is showing, and the
screens that carry the vendor's own live bidding leave it out. Only open bidding
answers with standings: a closed or direct tender's offers are sealed.

**A bid is filed with its proposal document, in one request.** The proposal PDF
is required, so `POST /api/vendor/proposals` is multipart: the offer is the
fields, the case for it is the file, and the row is written complete with both.
The object goes to R2 first and the row is written with its key, so a write that
does not land (the tender closed in between, or a second bid) takes the object
back with it and no bid can exist without its document. Revising keeps the filed
document unless the vendor replaces it; withdrawing the bid removes the object
with the row.

**A portfolio record states one thing.** The record is delivered work, so it
reads "Completed" with its year and nothing else. `status` is dropped from the
table (migration `0011`), the contract and the client: a "verified" label on a
record no process verifies is a claim without evidence.

## Consequences

- A draft saved before this change has no `step3` block; it resumes with both
  lists empty and the step gate asks for them.
- Projects submitted before this change carry an empty scope. The vendor page
  says so ("Nothing filed under this heading") rather than inventing entries.
- Bids filed before this change carry no document. The company's bid card says
  so ("No proposal document was filed with this bid.") rather than showing a
  link that would 404.
- `scripts/seed.sql` was regenerated: it was stale by the LVV document pack
  (nine checklist documents per project where `CHECKLIST_SLOTS` holds three),
  and it now matches `scripts/seed.ts`. The seeded negotiations also carried
  warranty figures in months inside a years column (36, 48), which the vendor's
  revision modal now shows: they read 3 and 4 years, the months their own notes
  describe.
- The glossary (`docs/GLOSSARY-ajukan-proyek.md`) still describes Step 3 as the
  LVV document pack. It is a design record of an earlier plan and is left as
  written; this ADR is the implemented shape.
