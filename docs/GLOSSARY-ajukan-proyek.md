# Glossary — GreenShift Project Submission Wizard (Steps 1–4)

The business surface ships in English (owner decision, audit F-28); the
Indonesian labels below are kept as the translation reference they were written
as. Structural changes from ADR-008 are noted per section.

## Wizard

- Wizard steps (COMPANY names, per ADR-006; supersede the old Step 1-internal
  names): 01. Project Profile, 02. Financial Eligibility,
  03. Supporting Documents, 04. Review & Submit.
- ADR-008: the wizard has no page title. Its own header is sticky and spans the
  content end to end, and it carries both the step strip and the action bar on
  one line at `sm` and up: Back (never validates) plus the primary action, which
  is "Save & continue" on steps 1 to 3 and "Submit the Project" on step 4. The
  submit action stays disabled until both declaration checkboxes are ticked, and
  there is no bottom action row. The step strip shows all four names at `sm` and
  up, with a short horizontal connector in each gap between steps at the
  circles' centre line; below `sm` the circles are shown alone and the active
  step's name appears beside them. The sticky bar sits flush under the shell
  header (gap 0) because the scroll container's top-padding was moved into an
  inner flex wrapper (ADR-008.6).
- Number entry (ADR-009): every numeric field groups large numbers with dots
  (`12.500,5`, `4.200.000.000`) once the field loses focus, drops characters
  that are not part of a number as they are typed, and refuses the values its
  rule set bands: the emission-reduction target is 0-100, the tenor 1-30, and
  the rest are non-negative. Grouping is display only; what is stored is the
  number the user typed.
- Eleanor (ADR-009): the review step's risk assessment is read back in prose.
  She is named in the UI, writes once per project into the assessment record,
  and states only what the assessment holds. A read serves the stored reading,
  or composes one from the same figures while the model call runs out of band,
  so the wizard itself never calls a model.

## Step 1 — Profil & Kebutuhan (implemented)

- Energy consumption (MWh/year) — `Konsumsi energi`: total electricity + fuel per year, ID format.
- Energy cost (Rp/year) — `Biaya energi`: total rupiah paid per year, ID format.
- Emission factor (tCO₂/MWh) — `Faktor emisi`: grid/fuel emission intensity.
  Covers the brief's "Sumber" + "Intensitas" tokens; no 4th input.
- Baseline (tCO₂): consumption × emission factor; the calculation basis.
- Emission reduction target (%) — `Target reduksi emisi`: percentage cut vs baseline, 0–100, drives the donut.
- Clean-energy target (MWh/year) — `Target energi bersih`: targeted annual renewable production.
- Commercial operation start — `Awal operasi komersial`: quarter + year (e.g. Q1 2026); its year drives Implementation risk.
- Location — `Lokasi`: searchable combobox over all 7,215 kecamatan,
  labelled "Kecamatan, Kabupaten/Kota, Provinsi" (BPS 2018); bundled CSVs
  under `public/kecamatan/`. "Lokasi tidak ditemukan" on zero matches.
- Live donut: `PieChart` whose value = target % (45% fallback).
- Risk Preview — one full-width row per tone (Financial/Technical/Implementation)
  with its badge: Low/Medium/High, or "Not filled in" when the inputs are empty.
  ADR-008: the three tones stack as rows instead of sitting in a three-column box
  grid, and the rail holds only this card and the donut summary.
- Energy-baseline docs — "Documents to Prepare": 3 required rows (12 months of
  electricity bills, load profile/account, site permit/legality), each uploaded
  through the draft. Separate from Step 3's legal/technical docs (ADR-005).
  ADR-008: this section sits in the middle column as Step 1's last section (it
  used to be at the bottom of the right rail), with one compact card per document
  carrying its own upload control.

## Step 2 — Kelayakan Finansial (ADR-004, implemented)

- Total CAPEX (Rp), Tenor Pembiayaan (years 1–30),
  Estimasi Penghematan Tahunan (Rp/year).
- Pendapatan Tahunan Perusahaan (Rp/year); Bentuk Jaminan (collateral Select).
- Laporan Keuangan + RAB via dashed upload zone (≥1 file required).
- Simulasi Credit Scoring: derived mock BBB+ with progress bar; "Belum dihitung" when empty.

## Step 3 — Dokumen Pendukung (ADR-005, implemented)

- Legalitas Entitas: Akta Perusahaan, NIB & NPWP (ships Uploaded demo state), Profil Perusahaan.
- Dokumen Teknis & Mitigasi Emisi: Studi Kelayakan, DRAM, Spesifikasi Teknis.
- Status Kelengkapan: `n / 6 Dokumen Terunggah` + green progress bar; Panduan LVV GRK info card.

## Step 4 — Review & Kirim (ADR-006, implemented)

- Ringkasan Proyek & Finansial: two read-only `bg-muted` blocks (Steps 1+2).
- Project Risk Assessment — `Penilaian Risiko Proyek` (ADR-006.7): derived
  section between Status Dokumen and Deklarasi. Risk score 0–100
  (Rendah <40, Moderat 40–69, Tinggi ≥70) from Step 1 tones + Step 2
  credit score + doc completeness; success probability = 100 − score.
  Breakdown rows (Finansial/Teknis/Implementasi/Pembiayaan, badge + bar);
  Risk Summary one-line verdict. Empty inputs → "Belum dihitung". B2 shows
  a compact score row + "Lihat Detail Penilaian Risiko" outline button;
  full dashboard opens in a controlled system Dialog modal (Round 5).

## MyProjects — My Projects (ADR-007, revised by ADR-008)

- Route `/business/projects`; the wizard lives at `/business/submit`. Both are
  reachable from `roleNav.business` and the shell marks the active one.
- ADR-008: no page title or description; one toolbar row carries the status and
  sector filters (options read off the loaded rows) plus "Submit a Project", and
  the table itself is the shared `DataTable` with its sorting, search, and
  pagination. Below `md`, Submitted and CAPEX fold into the project cell so a
  phone needs no sideways drag.
- Rows come from `GET /api/business/projects`: name with a muted
  location/sector line, submitted date, CAPEX, and the status pill the API
  returns (`Register for LVV`, `Awaiting LVV verification`, `Matchmaking`,
  `Verified`).
- After submit the project is the company's to move: the project's own page shows
  the same summary the review step showed, and the verification section on it is
  the reminder to register the project at Sistem Registri and appoint the LVV
  body. The page also reads the registry back
  (`GET /api/business/projects/:id/registry`), so a project the registry already
  holds while the platform still waits says so and asks for verification to be
  started here rather than leaving the company waiting on a step only they can
  take. Marking it registered (`POST /api/business/projects/:id/lvv`) moves the
  pill to `Awaiting LVV verification`; verification then answers out of band and
  clears the project into matchmaking. The LVV documents are not part of the
  summary or of the record: they are filed at Sistem Registri, which is where the
  LVV body reads them.
- Row actions: "View details" opens the project's own page, which is the same
  summary the review step showed plus the Green Project Blueprint it became; the
  download icon opens the project's first ready document, and says so when none
  is ready yet. The risk assessment lives on that page, so the list no longer
  opens it in a dialog.

## Revisions before an award (ADR-011)

- A bid is awarded only once its revisions are done: `POST
  /api/business/procurement/:projectId/award` refuses a bid whose latest round is
  still `PENDING_VENDOR_RESPONSE` (`409 INVALID_STATE`), and the bidding screen
  disables "Accept & award" and "Ask for a revision" on that bid, naming the round
  it waits on. Rejecting the bid stays possible.
- Asking for a second revision while one is open is refused too
  (`revision_pending`), so the vendor is never two asks behind.
- Deciding a tender closes its rounds: `AGREED` on the winning bid, `LOCKED` on
  every bid that was turned down or rejected, which is what the vendor's
  negotiation card and its action-required count read.

## Matchmaking — Vendor Matchmaking (ADR-008)

- Routes `/business/matchmaking` (list) + `/business/matchmaking/$projectId`
  (detail); nav item "Vendor Matchmaking".
- Own `MATCHMAKING_PROJECTS` rows with optional `selectedVendor`;
  empty shows "Belum ada", filled shows name + success icon.
- Detail stub: 65/35 grid, SMART cards, procurement methods, ringkasan,
  match factors, calc box. Static demo; real scoring later.
