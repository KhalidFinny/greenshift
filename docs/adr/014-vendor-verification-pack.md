# ADR 014 — The vendor verification pack

Status: Implemented (2026-09-23)

## Context

Company accounts verify themselves through the document scan (ADR 013). Vendor
accounts did not: a vendor's legal identity was whatever it typed into its
profile, `vendor_profiles.verified_at` existed with nothing that required a
document before an administrator set it, and the admin Vendors page offered a
Verify button that worked on an empty profile. The rubric the platform actually
applies is specific, and it is not the company's: an EPC or ESCO proves itself
with its industry certification (an ESCO licence or an ISO energy management
certificate), its tax number, and its company registration number.

## Decision

**The vendor's pack is NPWP, TDP, at least one certification entry, and the
certificate file.** `vendor_profiles` gains `tdp`, `certificate_name`,
`certificate_key`, `certificate_scan` (migration 0015) and
`verification_rejection_reason` (0016). The file is uploaded from the vendor's
Verification tab (`POST /api/vendor/profile/certificate`, multipart, PDF or
image, 10 MB) and served back from the same path; the scan reads it through
`scanCompanyDocument`, now generalised to take a subject and the account's
identity numbers, so the reading is stored on `certificate_scan` and shown to
the vendor and to the reviewer.

**The administrator gives the verdict, and only on a complete pack.**
`PATCH /api/admin/vendors/:id/verify` refuses `verified: true` while any part of
the pack is missing (`INVALID_STATE`, mirroring `verifyUser`'s `pack_not_filed`),
and the roster's Verify button is disabled for the same reason with the missing
items in its tooltip. Turning a profile down is always allowed and carries a
reason, which is stored and read back by the vendor.

**The scan does not verify a vendor.** Unlike the company flow, there is no
automatic verdict: the reading is evidence for the person deciding, because a
licence's validity is not something a text reading can settle. The vendor's
screen says which parts of the pack are still missing and, after a decision,
what the administrator wrote.

## Consequences

- A vendor that registered without TDP can add it on the Profile tab and file
  the certificate on the Verification tab; both write the same profile, and a
  partial save never clears a field it did not carry.
- A re-filed certificate clears the previous rejection reason: that verdict was
  about the file it replaces.
- Seeded vendors are written `VERIFIED` with legal identity numbers, so the
  fixtures keep working, but they carry no certificate object in R2: a seeded
  profile's certificate slot is empty in the review dialog. A newly registered
  vendor is the path that exercises the upload and the scan.
- `AI` remains optional: without the binding the reading is
  "not available, an administrator will read this certificate instead", which is
  exactly what the flow expects.
