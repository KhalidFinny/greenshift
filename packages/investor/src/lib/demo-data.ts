import type { ObligasiListing } from "@greenshift/api/contracts";

interface DemoObligasi
	extends Omit<ObligasiListing, "funded" | "fundingProgress" | "verifiedAt"> {
	verifiedAt?: string;
}

/**
 * Demo fallback for the public obligasi catalog.
 *
 * Mirrors the shape returned by `GET /api/investor/market` so the dashboard is
 * presentable when the local D1 has not been seeded yet. Bond codes are
 * placeholders — the real ones are issued by the broker/KSEI.
 */
const LISTINGS: DemoObligasi[] = [
	{
		id: 901,
		title: "Retrofit Chiller Pabrik",
		bondCode: "GSCHLR01",
		companyName: "PT Tekstil Nusantara Tbk",
		industrySector: "logam dasar",
		location: "Sidoarjo",
		budget: 500_000_000,
		riskScore: 24,
		targetEmissionReduction: 320,
		estimatedEnergySaving: 420_000,
		status: "verified",
		verifiedAt: "2026-06-12T00:00:00.000Z",
		blueprint: { irr: 12, npv: 98_000_000, paybackPeriod: 4 },
	},
	{
		id: 902,
		title: "Efisiensi Motor Listrik",
		bondCode: "GSMOTR01",
		companyName: "PT Logam Presisi Timur",
		industrySector: "manufaktur",
		location: "Gresik",
		budget: 300_000_000,
		riskScore: 18,
		targetEmissionReduction: 180,
		estimatedEnergySaving: 260_000,
		status: "verified",
		verifiedAt: "2026-06-28T00:00:00.000Z",
		blueprint: { irr: 16, npv: 61_000_000, paybackPeriod: 3 },
	},
	{
		id: 903,
		title: "Optimasi Compressed Air",
		bondCode: "GSAIRC01",
		companyName: "PT Sinar Pangan Abadi",
		industrySector: "makanan & minuman",
		location: "Pasuruan",
		budget: 200_000_000,
		riskScore: 31,
		targetEmissionReduction: 150,
		estimatedEnergySaving: 210_000,
		status: "verified",
		verifiedAt: "2026-07-04T00:00:00.000Z",
		blueprint: { irr: 18, npv: 38_000_000, paybackPeriod: 3 },
	},
	{
		id: 904,
		title: "Solar Rooftop 500 kWp",
		bondCode: null,
		companyName: "PT Green Nusantara",
		industrySector: "manufaktur",
		location: "Surabaya",
		budget: 1_000_000_000,
		riskScore: 35,
		targetEmissionReduction: 380,
		estimatedEnergySaving: 720_000,
		status: "on_progress",
		blueprint: {},
	},
	{
		id: 905,
		title: "Boiler Biomassa",
		bondCode: null,
		companyName: "PT Nusantara Kertas",
		industrySector: "kertas",
		location: "Pasuruan",
		budget: 2_500_000_000,
		riskScore: 41,
		targetEmissionReduction: 1240,
		estimatedEnergySaving: 1_800_000,
		status: "on_progress",
		blueprint: {},
	},
];

const FUNDED: Record<number, number> = {
	901: 150_000_000,
	902: 75_000_000,
	903: 60_000_000,
	904: 240_000_000,
	905: 500_000_000,
};

export const DEMO_OBLIGASI: ObligasiListing[] = LISTINGS.map((listing) => {
	const funded = FUNDED[listing.id] ?? 0;
	return {
		...listing,
		funded,
		fundingProgress: listing.budget ? funded / listing.budget : 0,
		verifiedAt: listing.verifiedAt ?? null,
	};
});
