export interface MatchmakingProject {
	id: string;
	name: string;
	location: string;
	sector: string;
	submittedAt: string;
	capex: number | null;
	selectedVendor: string | null;
}

/* ADR-008: matchmaking rows reuse MY_PROJECTS values; only the
 * Verified-style row carries a vendor. Real API replaces this later. */
export const MATCHMAKING_PROJECTS: MatchmakingProject[] = [
	{
		id: "mp-1",
		name: "PLTS Atap Pabrik Cikarang",
		location: "Cikarang, Jawa Barat",
		sector: "Manufaktur",
		submittedAt: "12 Agustus 2026",
		capex: 4_200_000_000,
		selectedVendor: null,
	},
	{
		id: "mp-2",
		name: "PLTS Ground-Mounted Karawang",
		location: "Karawang, Jawa Barat",
		sector: "Energi Terbarukan",
		submittedAt: "28 Juli 2026",
		capex: 12_750_000_000,
		selectedVendor: null,
	},
	{
		id: "mp-3",
		name: "Efisiensi Boiler Pabrik Gresik",
		location: "Gresik, Jawa Timur",
		sector: "Manufaktur",
		submittedAt: "3 Juni 2026",
		capex: 2_850_000_000,
		selectedVendor: "PT Solar Energi Nusantara",
	},
];

export interface RecommendedVendor {
	id: string;
	name: string;
	subtitle: string;
	score: number;
	price: string;
	duration: string;
	desc: string;
	costEstimate: string;
	relevantExperience: string;
	riskLevel: string;
	whyRank: string[];
}

export const RECOMMENDED_VENDORS: RecommendedVendor[] = [
	{
		id: "rv-1",
		name: "PT Surya Cipta Mandiri",
		subtitle: "EPC Solar PV Specialist",
		score: 92,
		price: "Rp 4,1 M",
		duration: "90 hari",
		desc: "Spesialis PLTS atap industri dengan 40+ proyek manufaktur selesai tepat waktu.",
		costEstimate: "Rp 4,1 M",
		relevantExperience: "40+ proyek PLTS atap",
		riskLevel: "Rendah",
		whyRank: [
			"Skor kesesuaian teknis tertinggi (90%)",
			"Rekam jejak 40+ proyek industri sejenis",
			"Durasi tercepat dengan garansi 5 tahun",
			"Struktur harga paling transparan",
		],
	},
	{
		id: "rv-2",
		name: "PT Solar Energi Nusantara",
		subtitle: "EPC Ground-Mount Specialist",
		score: 87,
		price: "Rp 4,3 M",
		duration: "105 hari",
		desc: "Kontraktor EPC berpengalaman untuk PLTS ground-mounted skala menengah.",
		costEstimate: "Rp 4,3 M",
		relevantExperience: "25+ proyek ground-mounted",
		riskLevel: "Rendah",
		whyRank: [
			"Spesialis ground-mounted skala menengah",
			"Tim EPC bersertifikat internasional",
		],
	},
	{
		id: "rv-3",
		name: "PT Hijau Daya Lestari",
		subtitle: "Komersial & Maintenance Specialist",
		score: 81,
		price: "Rp 3,9 M",
		duration: "120 hari",
		desc: "Penawaran paling kompetitif dengan garansi pemeliharaan 5 tahun.",
		costEstimate: "Rp 3,9 M",
		relevantExperience: "15+ proyek komersial",
		riskLevel: "Sedang",
		whyRank: ["Harga paling kompetitif", "Garansi pemeliharaan 5 tahun"],
	},
];

export interface MatchFactor {
	label: string;
	pct: number;
}

export const MATCH_FACTORS: MatchFactor[] = [
	{ label: "Kesesuaian teknis", pct: 90 },
	{ label: "Rekam jejak proyek", pct: 85 },
	{ label: "Kompetitivitas harga", pct: 78 },
	{ label: "Kapasitas pengerjaan", pct: 72 },
];

export interface ProcurementMethod {
	id: "OPEN_BIDDING" | "CLOSED_BIDDING" | "DIRECT_SELECTION";
	label: string;
	desc: string;
}

export const PROCUREMENT_METHODS: ProcurementMethod[] = [
	{
		id: "OPEN_BIDDING",
		label: "Lelang Terbuka",
		desc: "Terbuka untuk semua vendor terverifikasi di platform.",
	},
	{
		id: "CLOSED_BIDDING",
		label: "Lelang Tertutup",
		desc: "Hanya vendor rekomendasi yang diundang mengajukan penawaran.",
	},
	{
		id: "DIRECT_SELECTION",
		label: "Penunjukan Langsung",
		desc: "Pilih langsung satu vendor rekomendasi tanpa proses lelang.",
	},
];
