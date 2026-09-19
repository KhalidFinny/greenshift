# Glossary — GreenShift Project Submission Wizard (Steps 1–4)

UI copy stays Indonesian; English equivalents below for the team.

## Wizard

- Wizard steps (COMPANY names, per ADR-006; supersede the old Step 1-internal
  names): 01. Profil & Kebutuhan, 02. Kelayakan Finansial,
  03. Dokumen Pendukung, 04. Review & Kirim.
- Navigation: "Kembali" (Back, never validates) + "Simpan & Lanjut"
  (Save & Continue, validates current step). "Kirim Pengajuan Proyek"
  (Submit Project, Step 4) stays disabled until both declaration
  checkboxes are ticked.

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
- Risk Preview — `Preview Risiko`: 3 derived badges (Financial/Technical/Implementation):
  Low/Medium/High (`Rendah`/`Sedang`/`Tinggi`), or "Not yet filled" (`Belum diisi`) when inputs are empty.
- Energy-baseline docs — `Dokumen yang Disiapkan`: 3 required rows (12-month bills,
  load profile, permits/legality), each Done/Missing (`Sudah`/`Belum`) via local upload.
  Separate from Step 3's legal/technical docs (ADR-005).

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

## MyProjects — Proyek Saya (ADR-007)

- Route `/business/proyek` ("Proyek Saya"); wizard keeps `/business`
  ("Ajukan Proyek"). Both in `roleNav.business`; shell marks active.
- Demo rows (3): Review LVV / Matchmaking / Verified with name,
  location/sector muted line, tanggal pengajuan, CAPEX.
- Status pills: system `Badge` + status dot (amber/primary/green
  data-ink), never literal yellow/blue/green pills.
- Row actions: "Detail" text button + "Risk Assessment" outline button
  (chart icon, comment-only `isRiskModalOpen` TODO — no per-row modal).
