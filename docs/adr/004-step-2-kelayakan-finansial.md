# ADR 004 — Step 2: Kelayakan Finansial & Kapasitas Pembayaran

Status: Implemented (2026-09-18, grill Round 3: `wizard_scope` → per-step ADRs,
`stepper_names` → COMPANY names).

Covers COMPANY.md Step 2 only ("02. Kelayakan Finansial"). Implemented in
`packages/business/src/views/step-2.tsx` + `lib/credit-score.ts` +
`lib/validators.ts` (validateStep2) — this ADR is the contract that pass
shipped against.

1. Center, Section A — "Kebutuhan Pendanaan Proyek": three inline fields.
   Total CAPEX (Rp prefix, ID-format via `parseIdNumber`, required, ≥ 0),
   Tenor Pembiayaan (Tahun suffix, integer 1–30), Estimasi Penghematan
   Tahunan (Rp prefix, ID-format, required, ≥ 0).
2. Center, Section B — "Profil Keuangan Singkat": Pendapatan Tahunan
   Perusahaan (Rp prefix, ID-format, required, ≥ 0) + Bentuk Jaminan
   (ui `Select`, required; options fixed: Sertifikat Tanah/Bangunan,
   Mesin & Peralatan, Piutang Usaha, Jaminan Korporasi / Letter of Comfort).
3. Center, Section C — "Dokumen Finansial": one dashed-border upload zone
   accepting Laporan Keuangan + RAB (per-file rows with name, remove;
   local state only, same pattern as ADR-003.3). At least one file required
   to pass validation.
4. Right — "Simulasi Credit Scoring": derived, not static. Mock rating
   BBB+ mapped from a 0–100 score; progress bar + light `bg-muted`
   background. Score inputs: debt-service proxy
   (penghematan tahunan ÷ (CAPEX ÷ tenor), capped 0–100 contribution) and
   document completeness. Empty inputs → "Belum dihitung" state, never a
   fake score. The `agent.md` chart rule does not apply (progress bar over
   a score, not an operational pie/ring).
5. Validation gates "Simpan & Lanjut" exactly like Step 1 (`aria-invalid` +
   inline messages + `role="alert"` summary, no proceed on failure).
   CAPEX + tenor + penghematan feed Step 4 Section A read-only summary.
