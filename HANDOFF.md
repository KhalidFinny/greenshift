# GreenShift handoff

Written 2026-09-23 at the end of a long session. Read `CLAUDE.md` first: it is the
project's own context file and it is current. This file adds the state that is
**not** in the repo yet, and the traps that cost time.

---

## 1. What the product is

MRV (measurement, reporting, verification) platform for green financing in
Indonesia. Companies submit decarbonisation projects, vendors bid on the
tenders, brokers carry the financing, an admin verifies accounts and projects,
and the public bond catalog hands the money to a licensed securities partner.

- Stack, layout, roles, auth, seed accounts: `CLAUDE.md`, `TECH_STACK.md`.
- Design direction (palette, type, motif, dials): `DESIGN.md`.
- Decisions, newest last: `docs/adr/001` … `docs/adr/014`.

## 2. Environment, commands, traps

```bash
bun run dev            # everything, port 3000
bun run typecheck      # tsc --noEmit  (the only automated check that runs)
bunx biome check --write <paths>       # formatting and lint
bun run build && bunx wrangler deploy  # ships to greenshift.fiinnyy.my.id
bunx wrangler d1 migrations apply greenshift-db --local    # or --remote
bunx tsx scripts/seed.ts > scripts/seed.sql
bunx wrangler d1 execute greenshift-db --local --file=scripts/seed.sql
```

Traps, all hit for real:

1. **Local dev has no AI runtime.** `env.AI.toMarkdown` and `env.AI.run` throw
   under `wrangler dev`, so a document scan on localhost always lands on the
   "could not be read" branch. The remote worker's AI works and is verified.
   Test anything AI-shaped on the deployed worker.
2. **The dev server misses file writes.** After editing a file, Vite sometimes
   keeps serving the previous transform (symptom: `ReferenceError: <new export>
   is not defined`, or "Failed to fetch dynamically imported module"). Fix:
   `touch <file>`, or restart the dev server.
3. **Re-seeding invalidates sessions.** The seed deletes and re-inserts `users`
   with new ids, so every logged-in session stops resolving. Log in again after
   a reseed. `scripts/seed.sql` is destructive by design; never point it at a
   deployed database.
4. **`insertProposalAtomically` mirrors every `proposals` column in declaration
   order.** Adding a column to that table without adding it to that SELECT
   breaks bid submission with a 500.
5. **Workers AI answers in two envelopes.** Some models return `{response}`,
   others `{choices:[{message:{content}}]}`. `aiAnswerText()` in
   `apps/api/src/lib/ai-answer.ts` reads both and is the only place that does;
   do not narrow it back to one.
6. **The AI binding type is structural** (`Env.AI?: AiBinding` in
   `apps/api/src/env.ts`), because the installed `@cloudflare/workers-types`
   does not export the binding class. Add methods to that interface as needed.

## 3. What shipped

Committed as `ade090e`:

- **Wizard Step 3 (Scope of Work)**: technical requirements + expected
  deliverables; read by the matching model, shown to bidders.
- **One bid filing**: `POST /api/vendor/proposals` is multipart and the proposal
  PDF is required; the bid row is written complete with its document, or not at
  all.
- **Live ranking per tender**: `GET /api/vendor/leaderboard?tenderId=`.
- **Blueprint shown immediately** to bidders.
- **Notification hub**: the bell lists 20, marks read as opened, and marks the
  whole feed read (`PATCH /api/<role>/notifications`).
- **ADR 012** records it.

In the working tree (this session, not yet committed):

- **Company verification, self-verifying by AI scan** (ADR 013): NIB + NPWP +
  Akta Pendirian + SIUP, read by `scanCompanyDocument`, verdict automatic, admin
  review dialog for the cases the scan cannot read.
- **Vendor verification pack** (ADR 014): NPWP, TDP, at least one certification
  entry and the ESCO/ISO certificate file on the profile; the certificate is
  uploaded and served from `/api/vendor/profile/certificate`, read by the same
  scan engine, and the admin Vendors page refuses a verdict on an incomplete
  pack. Migration 0016 adds `vendor_profiles.verification_rejection_reason`.
- **District autocomplete** (`DistrictCombobox` over `loadDistricts` in
  `@greenshift/core`), used by registration, settings, verification and the
  wizard's location field.
- **Eleanor reads both AI envelopes** (`aiAnswerText`), so the risk narrative is
  the model's own text rather than the composed fallback.
- **The invented `Satisfaction` metric is gone** from the vendor performance
  card: the API had no endorsement source, so the tile showed a hardcoded 0.
- **Docs refreshed** (README, INSTALLATION, TECH_STACK,
  TECHNICAL_DOCUMENTATION), dead repo furniture deleted (`saveprogress.md`,
  `progress.md`, `agent.md` kept, `.cursorrules`, `.cta.json`, `anti-slop/`, the
  four dev-only scripts and their `package.json` entries), and the AI-generated
  multi-paragraph comments cut to one or two lines across the repo.

## 4. How to verify

1. `bun run typecheck` and `bunx biome check --write <paths>`.
2. `bun run build && bunx wrangler deploy`, then
   `bunx wrangler d1 migrations apply greenshift-db --remote`.
3. Drive the real UI with the browser tools on `http://localhost:3000` (or the
   deployed host for anything AI-shaped). Log in as `business1` / `vendor1` /
   `admin1`, password `12345678`.
4. `bunx wrangler tail greenshift --format pretty` for server-side errors.
5. For the AI path, register a throwaway company on the deployed site and file
   text-based PDFs, then delete the test account:
   `bunx wrangler d1 execute greenshift-db --remote --command "delete from users where email='...'"`.
   `qa.scan@greenshift.dev` is still on the remote database.

## 5. Open findings, not yet actioned

- **Seeded accounts carry no certificate files** (a fixture has no R2 object),
  so an admin reviewing a seeded company or vendor sees the identity and the
  filing date with the document slots empty. Only a newly registered account
  exercises the scan.
- **`docs/GLOSSARY-ajukan-proyek.md`** is a design record of an earlier plan for
  Step 3; the wizard step is now scope of work. Kept as history.
- **`docs/VENDORROLE.md` / `docs/BROKERROLE.md`** are role specifications from
  before the build; the code is the source of truth where they differ.

## 6. Decisions the owner made (do not re-litigate)

| Question | Answer |
|---|---|
| Address input | District autocomplete from the bundled dataset, not a live map service |
| Self-verification | One step: confirm the details and file the documents together |
| The block | Nothing in `/business` works until an **admin** verifies the account |
| Company documents | Akta Pendirian, NIB, SIUP (rubric); NPWP kept as identity |
| Vendor documents | ESCO licence or ISO energy certificate, plus NPWP and TDP |
| Who gives the verdict | The AI scan decides a company automatically; a vendor is decided by an administrator |
| Unreadable scan | Ask for a clearer scan, three tries, then an admin decides |
| Admin override | Allowed both ways: verify a stuck account, revoke one found discrepant later |
| Portfolio label | One label, "Completed"; the verification flag is gone |
| Procurement pipeline | The revision flow is correct; do not touch it |
