# ADR 005 — Step 3: Dokumen Verifikasi LVV & Legalitas

Status: Implemented (2026-09-18, grill Round 3: `wizard_scope` → per-step ADRs,
`doc_lists` → separate concerns).

Covers COMPANY.md Step 3 only ("03. Dokumen Pendukung"). Implemented in
`packages/business/src/views/step-3.tsx` — this ADR is the contract that
pass shipped against.

1. Center: structured list, each row = title + short description + upload
   control on the right (same per-row `<input type=file>` pattern as
   ADR-003.3, local state only).
   Section A "Legalitas Entitas" (3 rows): Akta Perusahaan, NIB & NPWP,
   Profil Perusahaan. Section B "Dokumen Teknis & Mitigasi Emisi" (3 rows):
   Studi Kelayakan, DRAM, Spesifikasi Teknis.
2. NIB row ships in "Uploaded" demo state (dummy filename + trash icon) so
   reviewers see the done-state styling on first paint.
3. Relationship to Step 1 docs (grill `doc_lists` → separate concerns): the
   Step 1 trio (tagihan 12 bln, profil beban, izin) stays energy-baseline
   evidence owned by Step 1. These 6 are legal/technical evidence owned by
   Step 3. No shared registry, no cross-step mutation; Step 4 reads both.
4. Right: "Status Kelengkapan" card — `n / 6 Dokumen Terunggah` with green
   progress bar (bar, not ring/pie per `agent.md`) + "Panduan LVV GRK" info
   card (static guidance copy).
5. Completeness (n/6) feeds Step 4 Section B checklist; nothing uploads to a
   backend in this pass.
