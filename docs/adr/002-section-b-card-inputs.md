# ADR 002 — Section B: Card-Inputs with Indonesian-Format Parsing

Status: accepted (2026-09-09, grill Round 1: `section_b_inputs` → strict + ID-format).

Decision: "B. Current Energy Condition" is NOT static cards + sparklines.
Three large cards, each holding one `@greenshift/ui` `<Input>`: energy
consumption (MWh/year), energy cost (Rp/year), emission factor (tCO₂/MWh),
with visual unit prefix/suffix affixes. Sparklines removed entirely
(explicit `COMPANY.md` §22 override). The brief's 4 tokens (Konsumsi,
Biaya, Sumber, Intensitas) are covered by these 3 inputs: "Sumber" and
"Intensitas" both resolve to the emission factor (grid/fuel intensity);
no 4th input exists (grill Round 3: `section_b_fourth` → 3 suffice).

Parsing (`parseIdNumber` in `packages/business/src/dashboard.tsx`):
strips units/Rp/spaces, `1.234.567,89` → `1234567.89` (dot = thousands
separator when a comma is also present; lone comma = decimal; dot-only in
strict thousands groups like `4.200.000.000` → digits, otherwise JS decimal),
rejects non-finite/negative values, all fields required. Failed validation →
`aria-invalid` + inline message + `role="alert"` summary, and
"Submit & Lanjut" does not proceed. Rationale: users transcribe manually
from physical documents; lenient coercion would poison the derived
reduction percentage.
