# ADR 013 — Company verification: the address, the pack, and the scan

Status: Implemented (2026-09-23, QA batch: registration and company verification)

## Context

Registration created a company account that could use the platform immediately,
on nothing but its own declaration: the address was a free-text field, no
document was ever asked for, and `users.verifiedAt` existed without anything
that filled it in or gated on it. Three things followed from that:

1. **The address was whatever was typed.** "malang" is a string the platform
   cannot compare with a project's location, so the company's own address was
   useless to the matchmaking model that reads provinces.
2. **A company could reach a dashboard it could not use.** The account worked,
   so nothing told the company what was missing, and the verification it needed
   was never asked for at the moment it was possible to give it.
3. **Nothing established that the entity was real.** A vendor's legal identity
   (NIB, NPWP) is checked by an administrator; a company's was not checked at
   all, and the only documents the platform collected were a project's.

## Decision

**The address is a district, chosen from the dataset the platform already
ships.** The registration form and the company's settings both use one control
(`DistrictCombobox`, in `@greenshift/ui`, over `loadDistricts` in
`@greenshift/core`), with an optional free-text line for the street, building
and number. The combined value is still one `address` string on the wire, so the
contract is unchanged; what changed is that the part the platform reasons about
is a real place from a closed list. The submission wizard's location field now
uses the same control, so there is one district picker in the product rather
than two.

**Registration ends at the verification step, not on the dashboard.** A new
company account is `NOT_VERIFIED`, and the business surface is closed to it:
`requireVerifiedCompany` on the API router (everything except the verification
routes) and `requireVerifiedCompany` in the business route's `beforeLoad` (every
screen except `/business/verification`). The company confirms its details, files
its legal identity numbers and the two certificates behind them, and submits the
pack: one screen, one job, with the list of what is still missing on it.

**The pack is scanned, and the scan is the verdict.** On submit, each
certificate is converted to text (`AI.toMarkdown`) and a model reads two things
off it: what kind of document it is, and the company name and number it states.
The model is deliberately not asked whether the document is genuine; the
comparison against the account happens in code, on that reading, so every verdict
traces to words the document contains. Then:

| The reading | The verdict |
|---|---|
| Both certificates read as the document their slot claims, naming this company, carrying the numbers filed | `VERIFIED`, automatically |
| A certificate names another company, or states a number that is not the one filed, or is not that kind of document | `REJECTED`, with the reading that says why; the company corrects and re-files |
| A certificate cannot be read | `NEEDS_RESCAN`, with a budget of three clearer scans; after that the account goes to `PENDING` and an administrator decides, with the same reading in front of them |

**An administrator can still decide, in both directions.** The admin Users page
gains a review dialog showing the filed identity, both certificates and what the
scan read off each. Verifying a `PENDING` account is allowed; revoking a
`VERIFIED` one (a discrepancy found later) is allowed and carries a reason, which
the company reads.

## What this establishes, and what it does not

The scan checks that the company filed the certificate its own record claims,
naming the company that filed it, carrying the numbers on the account. It does
**not** prove the entity exists: that is the registry's word, and the platform
has no registry integration. The page says so in as many words, because a
verification badge that overstates what it checked is worse than none. A registry
lookup is the seam a real integration would fill: `scanCompanyDocument` is the
only place that would change.

## Consequences

- Company accounts created before this change are `NOT_VERIFIED` by default and
  are therefore held at the verification step, because the migration cannot
  invent a pack they never filed. The seeded companies are written as
  `VERIFIED`, with a filed pack and legal identity numbers, so the fixtures keep
  working: a reseed is what restores them.
- The seeded companies carry no certificate files (a fixture has no object in
  R2 to serve), so an administrator reviewing a seeded company sees the identity
  and the filing date with the slots empty. A newly registered company is the
  path that exercises the scan.
- `AI` is optional in `Env`, as it already was for Eleanor. Without the binding,
  every scan reads as unreadable, so a company spends its rescan budget and the
  account lands with an administrator: the fallback is a person, never a pass.
- The verification state is stored (`users.verification_state`) rather than
  derived, because the scan's verdict is not a function of the other columns and
  every request is gated on it. The dated facts (`verified_at`,
  `legal_docs_submitted_at`, `verification_rejection_reason`) are still written
  beside it, so the history is readable.
