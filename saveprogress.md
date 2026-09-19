# Save progress

Handoff for the next session. Read this before touching the business wizard.

## Where this came from

The user handed over `/home/finny/Downloads/BACKEND-HANDOVER-business-wizard.md`
(a teammate's spec) and asked for the business wizard API to be implemented
**following this repo's conventions**, not the doc's. The doc is stale in two
ways worth knowing up front:

- It says `routes/vendor/…`; this repo was restructured into
  `apps/api/src/modules/<role>/<feature>/`.
- It calls the body guard `requireJson`; here it is `requireJsonBody`.

The **endpoints and payload shapes** in the doc are the contract. Everything
else (file layout, helper names) follows the repo.

## Done this session

### Schema

`drizzle/0005_naive_oracle.sql` (applied to local D1):

- `drafts` — client-generated text id, `company_id`, `payload` JSON, `step`,
  `project_id` (set on submit so a replay can be answered with it).
- `draft_documents` — files uploaded **before** submit. Deliberately a separate
  table: the doc wanted uploads to create `project_documents` rows, but that
  table requires a `project_id` and the project does not exist until submit.
  Submit promotes these rows into `project_documents`. This also avoided a
  SQLite table rebuild, which D1 rejected inside its migration transaction.
- `projects` gained 13 wizard columns (`konsumsi_mwh`, `biaya_rp`,
  `faktor_emisi`, `target_pct`, `target_mwh`, `timeline_quarter`, `capex_rp`,
  `tenor_tahun`, `penghematan_rp`, `pendapatan_rp`, `jaminan`, `credit_score`,
  `credit_rating`). Step 1's `ringkasan` reuses the existing `description`.

### API — `apps/api/src/modules/business/`

```
business.routes.ts          router: session + role + csrf, mounts the four below
business.shared.ts          pill status, document slots, upload limits, mappers
business.validation.ts      Step 1/2 rules, Indonesian messages verbatim
business.scoring.ts         creditScore + projectRisk, ported line for line
business.scoring.test.ts    23 tests, same vectors as the frontend suite
business.validation.test.ts 14 tests, one per 422 field
drafts/                     PUT + GET /drafts/:draftId
documents/                  upload, delete, list, download
projects/                   POST /projects/submit, GET /projects
risk/                       GET /projects/:id/risk
```

Mounted at `/api/business` in `apps/api/src/index.ts`.

**Two deviations from the doc, both deliberate:**

1. `requireJsonBody` is NOT on the router, unlike the other role routers. The
   document upload is multipart and that guard rejects anything not JSON, so the
   two JSON mutations apply it per route.
2. Cross-company access answers **404**, not the doc's 403. The repo's existing
   pattern (see `modules/broker/projects`) scopes the query so another
   company's row is indistinguishable from a missing one, and the doc's own §6
   prefers 404-shaped for enumeration.

Errors carry a `fields` map now: `ApiErrorDetails` in `lib/response.ts`, merged
into `{ error: { code, message, fields, projectId } }`.

### Client

`packages/core/src/api/client.ts` has an `api.business` group: `saveDraft`
(silent), `draft`, `uploadDocument`, `deleteDocument`, `submit`, `projects`,
`risk`, `documents`, `downloadPath`.

`packages/core/src/index.ts` re-exports the business contract types, because
role packages may only import from core.

### Frontend

- `packages/business/src/my-projects.tsx` now reads `api.business.projects()`,
  fetches the risk on demand, downloads the first ready document, and has the
  loading / empty / error states it was missing.
- Deleted `packages/business/src/lib/my-projects.ts` and its test
  (`MY_PROJECTS`, `demoRiskForStatus`, `downloadProjectSummary`).
- `packages/business/src/lib/use-business-draft.ts` — the hook: draft id in
  `localStorage`, debounced silent autosave, resume, submit. Autosave is
  suppressed until the resume has been applied, or seeding the form would save
  the empty state straight back over the stored draft.

### Unrelated but landed in the same stretch

- **Merge**: `origin/master` (a teammate's business-wizard branch) was merged;
  3 conflicts resolved. `src/routeTree.gen.ts` had to be regenerated because
  the auto-merge left it stale.
- **Landing page could not scroll**: origin's scroll-lock commit put
  `overflow: hidden` on `html, body` globally. Now scoped with
  `html:has([data-shell-sidebar])`, so the shell keeps its single inner
  scroller and the landing and bond catalog scroll normally. This also fixed
  the landing header, whose state comes from a scroll listener.
- **Mobile**: the role shell is desktop-only (`w-64` sidebar, zero responsive
  classes). It now has an off-canvas drawer with a labelled "Menu" button,
  scrim, Escape, and close-on-navigate; 44px tap targets; reflowing padding.
  Six tab strips scroll on mobile; three fixed-width filters go fluid.
- **Register** rebuilt on a shared `src/components/auth-layout.tsx`, so
  `/login` and `/register` cannot drift. The auth layout is responsive.
- **Shell chrome out of the page fade**: `data-shell-sidebar` and
  `data-shell-header` get `view-transition-name`, and their groups keep the
  incoming frame (dropping the stale one, because `plus-lighter` would
  double-expose identical frames).

## Wizard wiring (Option A) — DONE

`packages/business/src/dashboard.tsx` is now on the API:

- `useBusinessDraft(onResume)` is called after the last `useState`; the resume
  seeds Step 1 and Step 2 string state plus `activeStep`.
- An effect autosaves both data steps. The hook debounces at 800ms and stays
  quiet until the resume is applied, so seeding cannot overwrite the draft.
- `handleFile`, `handleFinFiles` and `handleStep3Upload` upload through
  `draft.uploadDocument` and keep the returned id alongside the file name
  (`uploadedIds`, `finFileIds`, `step3Ids`); the remove buttons delete server
  side.
- `handleSubmitProject` re-runs the client rules, refuses to send a missing
  number as a zero, sends all six Step 3 slots (null where absent), and calls
  `draft.submit`. `setSubmitted(true)` now only runs when the server returned a
  project.
- The seeded demo NIB is gone; Step 3 starts empty.

Also removed: every em dash in the business package (18 of them, R-02). Prose
dashes became punctuation, and the `"—"` placeholders became `"Belum diisi"`,
matching the projects page. Repo-wide count is now 0.

## Deployed and verified live (2026-09-19)

Worker `greenshift` deployed to **greenshift.fiinnyy.my.id** (version
`fab1c8b1-d03d-4e1e-ad58-f00adfb8dcd1`). Bindings: KV, D1 `greenshift-db`,
R2 `greenshift-assets`.

The remote database was **barren before this**: 7 demo accounts, 0 projects,
0 tenders, 0 proposals, and migrations 0004 and 0005 unapplied. It now carries
the full fixture set:

| | count |
|---|---|
| users (5 per role) | 25 |
| projects / tenders / proposals | 39 / 39 / 38 |
| broker assignments | 30 |
| vendor match scores / energy forecasts | 50 / 150 |
| notifications / audit logs | 58 / 15 |

Every remote account is a `@greenshift.dev` demo account with password
`12345678`; there was no real data to lose, which is why the seed's destructive
reset was acceptable here. **Do not re-run it once real accounts exist.**

### Endpoints exercised against the live worker

All nine, by hand, signed in as `business1`:

- `GET /api/business/projects` — 200, returns seeded rows with pill statuses.
- `PUT /api/business/drafts/:id` — 200. Merging is proven: a second save that
  sent only `step2` left `step1` intact.
- `GET /api/business/drafts/:id` — returns the merge.
- `POST /api/business/drafts/:id/documents` — 201 multipart, which also proves
  `requireJsonBody` is correctly not blocking the upload.
- `POST /api/business/projects/submit` — **201**, `baselineTco2` 10625.425
  (= 12500.5 x 0.85), credit 73/"A", risk 63/"Moderat".
- Replay of the same submit — **409** with `projectId`.
- `GET /api/business/projects/:id/risk` — 200, recomputed, matches submit.
- `GET /api/business/projects/:id/documents` — 200, `downloadUrl` null while
  OCR is pending.
- `GET /api/business/projects/:id/documents/:docId/download` — **409 NOT_READY**
  while pending, as designed.
- Unknown project — **404**, confirming the cross-company deviation.

### A real bug this found

The same upload is legitimately referenced from both `step2.fileIds` and
`step3.docStates`, so the ownership check compared 2 against 1 row and rejected
every submit that used a document in both places. Fixed by de-duplicating the
referenced ids in `projects.service.ts` and `drafts.service.ts`. The unit tests
did not catch it; only the live submit did.

### Not yet exercised by hand

The wizard in a browser. The endpoints are proven over HTTP, but the
autosave-on-keystroke, the resume-on-refresh and the upload UI have only been
reviewed as code. Worth a pass as `business1` on `/business`.

## Open questions for the user

- The incoming business feature is **entirely Indonesian**, while
  `DESIGN.md` says "English only, everywhere. No mixed-language screens."
  The merge kept origin's Indonesian nav labels rather than desyncing them from
  the feature behind them. Which wins?
- `broker-platforms.ts` (investor) is external reference data with verified
  Play Store links, not dummy data. Left as is.
