# ADR 006 — Step 4: Review & Finalisasi (+ Wizard Shell)

Status: Implemented (2026-09-18, grill Round 3: `wizard_scope` → per-step ADRs,
`stepper_names` → COMPANY names).

Covers COMPANY.md Step 4 ("04. Review & Kirim") plus the wizard shell that
links all four steps. Implemented in `packages/business/src/dashboard.tsx`
(shell) + `packages/business/src/views/step-4.tsx`.

1. Stepper (all steps): labels become the COMPANY names —
   01. Profil & Kebutuhan, 02. Kelayakan Finansial, 03. Dokumen Pendukung,
   04. Review & Kirim. This supersedes the ADR-003.5 / glossary placeholder
   names (Energy Data → Goals & Documents → Verification → Submission),
   which described Step 1 internals, not the wizard. Steps are clickable
   only backwards (never skip ahead past an unvalidated step); state = a
   single `activeStep` index + per-step validity flags in the page component.
2. Center, Section A — "Ringkasan Proyek & Finansial": two read-only blocks
   (Steps 1 and 2 values) on `bg-muted` (token substitute for the mock's
   `bg-gray-50`, per ADR-001). Accordions acceptable if the block grows.
3. Center, Section B — "Status Dokumen": compact list of Step 3's 6 docs +
   Step 1's 3 docs, green check icons for uploaded rows only. No fake
   checks for missing rows.
4. Center, Section C — "Deklarasi & Verifikasi Manual": distinct card with
   2 mandatory checkboxes (Green Bond consent + data-validity declaration).
   Both unchecked → Kirim disabled.
5. Right — sticky "Finalisasi Pengajuan" card: dark-green primary
   "Kirim Pengajuan Proyek" (disabled until both checkboxes ticked) +
   "Langkah Selanjutnya" info card (3–5 day review copy).
6. Bottom nav (Center, every step): secondary "Kembali" + primary
   "Simpan & Lanjut". Lanjut runs the step's validation (same pattern as
   Step 1); Kembali never validates. No POST/backend in this pass — Kirim
   shows a confirmation state only.
7. Center, Section B2 — "Project Risk Assessment" (added 2026-09-19, grill
   Round 4). Sits between Status Dokumen (B) and Deklarasi (C). Layout:
   top full-width card split in two (risk score donut left, success
   probability + sparkline right); 60/40 grid below (Risk Breakdown left,
   Key Risk Factors right); bottom row (Mitigation Actions + Risk Summary).
   All scores DERIVED (grill `score_source`): 72/100-style number and 84%-
   style probability computed from Step 1 risk tones + Step 2 credit score
   + doc completeness; empty inputs → "Belum dihitung", never fake numbers.
   Surfaces are `bg-card` on a `bg-muted` panel (grill `risk_tokens`;
   token substitute for the brief's bg-gray-50/white, per ADR-001).
   Donut = ui `PieChart` + `PieSlice` (orange slice = risk share) and the
   sparkline is a tiny inline SVG trend (grill `donut_sparkline`;
   statistical-display exception like ADR-003.1 — project risk is a
   statistical aggregate, not an operational checklist). 4 breakdown rows
   mirror existing tones (Finansial/Teknis/Implementasi + Pembiayaan from
   credit score), each badge + bar; factors list derives from the worst
   tones with warning icons; mitigations are static guidance copy.
   Modal refactor (2026-09-19, grill Round 5: `modal_empty/modal_surface/
   modal_state` → modal-with-empty-state / system-Dialog / controlled):
   the B2 dashboard NO LONGER renders inline — the page was too long.
   The B2 card now shows a compact score row (score + level badge +
   success %) and a secondary outline "Lihat Detail Penilaian Risiko"
   button (eye icon). The full `RiskAssessmentBody` (donut, sparkline,
   breakdown, factors, mitigations, summary) lives in a controlled system
   `Dialog` (`isRiskModalOpen`, built-in X, `bg-popover` token surface
   substituting the brief's literal bg-white, `sm:max-w-2xl` responsive).
   Modal with null risk shows the same "Belum dihitung" row; the button
   stays enabled.
