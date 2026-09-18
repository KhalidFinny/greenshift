import type { BondListing } from "@greenshift/api/contracts";

interface DemoBonds
	extends Omit<BondListing, "funded" | "fundingProgress" | "verifiedAt"> {
	verifiedAt?: string;
}

/**
 * Demo fallback for the public bond catalog.
 *
 * Mirrors the shape returned by `GET /api/investor/market` so the dashboard is
 * presentable when the local D1 has not been seeded yet. Bond codes are
 * placeholders: the real ones are issued by the broker/KSEI.
 */
const LISTINGS: DemoBonds[] = [
	{
		id: 901,
		title: "Factory Chiller Retrofit",
		bondCode: "GSCHLR01",
		companyName: "PT Tekstil Nusantara Tbk",
		industrySector: "base metals",
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
		title: "Electric Motor Efficiency",
		bondCode: "GSMOTR01",
		companyName: "PT Logam Presisi Timur",
		industrySector: "manufacturing",
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
		title: "Compressed Air Optimization",
		bondCode: "GSAIRC01",
		companyName: "PT Sinar Pangan Abadi",
		industrySector: "food & beverage",
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
		industrySector: "manufacturing",
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
		title: "Biomass Boiler",
		bondCode: null,
		companyName: "PT Nusantara Kertas",
		industrySector: "paper",
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

export const DEMO_OBLIGASI: BondListing[] = LISTINGS.map((listing) => {
	const funded = FUNDED[listing.id] ?? 0;
	return {
		...listing,
		funded,
		fundingProgress: listing.budget ? funded / listing.budget : 0,
		verifiedAt: listing.verifiedAt ?? null,
	};
});
