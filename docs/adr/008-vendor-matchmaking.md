# ADR 008 — Vendor Matchmaking Master-Detail (Business)

Status: accepted (2026-09-19, grill Round 16).

New `MatchmakingList.tsx` + `MatchmakingDetail.tsx` pages in
`packages/business` as siblings of the wizard and MyProjects, per the
four grill calls.

Polish (2026-09-19, grill Round 17: literal spec surface, FA icons,
dynamic rank, derived metrics): the detail page uses literal spec
classes (`bg-gray-50` page, `bg-white` cards, `border-green-500`,
`bg-green-50/100`, emerald/blue fills) per explicit user order,
breaking ADR-001 by direction. Icons stay Font Awesome. #1 follows
the top scorer dynamically. Header metrics derive from the row
(capacity + budget from CAPEX, type from sector). Row rebuild (Round
18: same split): header card gains the solar icon block + divide-x
dividers; vendor cards become unified 5-section horizontal rows
(rank square, identity + subtitle, huge score, 3-col metrics grid,
Lihat Detail chevron); Best Match keeps its why-rank section;
right column labels gain icons with far-right percentages. Banner move
(Round 19): Langkah Selanjutnya sits outside the 65/35 grid at full
page width; Lanjutkan carries faArrowRight (FA, not lucide) replacing
the sun icon. Accordion (Round 20: badge-by-score / best-expanded /
generic-detail): cards are clickable rows (`expandedVendor` state,
best id default); Best Match + why-rank stay with the top scorer
always; expanded non-best cards show generic detail; chevron flips
via rotate-180. Border follows expansion (Round 21): green
`border-2 border-green-500` sits exclusively on
`vendor.id === expandedVendor`; closed cards — including #1 — use
neutral `border border-gray-200`. Badge still follows score.
Lanjutkan (Round 22: alert-literal / list-target / require-method):
literal `window.alert` per explicit user order (departing from the
Round 12 no-alert precedent), then navigates to
`/business/matchmaking`; disabled until a procurement method is
selected, with a hint row when missing.

1. Data (grill `match_data` → separate lib rows): new
   `packages/business/src/lib/matchmaking.ts` with its own
   `MATCHMAKING_PROJECTS` rows (project fields + optional
   `selectedVendor`), reusing `MY_PROJECTS` values rather than
   extending them. Verified-style row carries
   "PT Solar Energi Nusantara"; others carry null. Real API replaces
   it later; no backend in this pass.
2. List page: header + `Table` columns Nama Proyek / Tanggal Pengajuan
   / Nilai CAPEX / Vendor Terpilih / Aksi. Empty vendor cell shows
   muted "Belum ada"; filled cell shows vendor name + green success
   icon (`faCircleCheck`, `text-primary`). Empty action is primary
   "Cari Vendor" (Link to the detail route); filled action is
   secondary outline "Detail Vendor" (same target for now).
3. Detail (grill `detail_depth` → stub with sections): routed stub at
   `/business/matchmaking/$projectId` with the 65/35 grid. Left:
   SMART RECOMMENDATION expandable vendor cards (native `<details>`)
   + PILIH METODE PROCUREMENT (three method options, local state).
   Right: RINGKASAN KEBUTUHAN, MATCH FACTORS bars, calculation info
   box. Static demo content; real SMART scoring later.
4. Surfaces (grill `detail_tokens` → tokens): `bg-muted` panel +
   `bg-card` section cards (token substitute for the brief's
   `bg-gray-50`). Routes (grill `detail_route` → nested pair):
   `/business/matchmaking` list + `/business/matchmaking/$projectId`
   detail; nav gains "Vendor Matchmaking". Unknown project id shows a
   Belum-ditemukan empty state, never a crash.
