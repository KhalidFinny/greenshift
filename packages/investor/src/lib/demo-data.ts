import type {
	BondSummary,
	PortfolioDetail,
	PortfolioItem,
} from "@greenshift/api/contracts";

/**
 * Demo fixtures for the investor dashboard, mirroring the admin package's
 * DEMO_* fallback: when the account has no bonds yet the dashboard renders
 * this coherent sample (bonds, ROI schedules, MRV reports) so the UI is
 * never an empty shell. Any real bond bought later replaces the demo view.
 */
const DEMO_NOW_MS = Date.parse("2026-09-04T00:00:00.000Z");

const iso = (daysAgo: number): string =>
	new Date(DEMO_NOW_MS - daysAgo * 86_400_000).toISOString();

const addMonths = (from: Date, months: number): Date =>
	new Date(from.getFullYear(), from.getMonth() + months, 1);

const periodOf = (date: Date): string =>
	`${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;

interface DemoProject {
	id: number;
	title: string;
	industrySector: string;
	location: string;
	status: string;
	budget: number;
	targetEmissionReduction: number;
	estimatedEnergySaving: number;
	irr: number;
	npv: number;
	paybackPeriod: number;
}

const P_CHILLER: DemoProject = {
	id: 901,
	title: "Retrofit Chiller Pabrik",
	industrySector: "logam dasar",
	location: "Sidoarjo",
	status: "funding",
	budget: 500_000_000,
	targetEmissionReduction: 320,
	estimatedEnergySaving: 420_000,
	irr: 12,
	npv: 98_000_000,
	paybackPeriod: 4,
};

const P_MOTOR: DemoProject = {
	id: 902,
	title: "Efisiensi Motor Listrik",
	industrySector: "manufaktur",
	location: "Gresik",
	status: "funding",
	budget: 300_000_000,
	targetEmissionReduction: 180,
	estimatedEnergySaving: 260_000,
	irr: 16,
	npv: 61_000_000,
	paybackPeriod: 3,
};

const P_AIR: DemoProject = {
	id: 903,
	title: "Retrofit Kompresor Udara",
	industrySector: "makanan & minuman",
	location: "Pasuruan",
	status: "funding",
	budget: 200_000_000,
	targetEmissionReduction: 150,
	estimatedEnergySaving: 210_000,
	irr: 18,
	npv: 38_000_000,
	paybackPeriod: 3,
};

type EmissionSeed = {
	daysEnd: number;
	baseline: number;
	actual: number;
	anomaly?: boolean;
};

const EMISSIONS: Record<number, EmissionSeed[]> = {
	[P_CHILLER.id]: [
		{ daysEnd: 300, baseline: 120_000, actual: 108_000 },
		{ daysEnd: 210, baseline: 120_000, actual: 105_000 },
		{ daysEnd: 120, baseline: 120_000, actual: 104_500 },
		{ daysEnd: 30, baseline: 120_000, actual: 112_000, anomaly: true },
	],
	[P_MOTOR.id]: [
		{ daysEnd: 250, baseline: 85_000, actual: 74_000 },
		{ daysEnd: 160, baseline: 85_000, actual: 70_500 },
		{ daysEnd: 70, baseline: 85_000, actual: 72_900 },
	],
	[P_AIR.id]: [
		{ daysEnd: 150, baseline: 60_000, actual: 52_000 },
		{ daysEnd: 60, baseline: 60_000, actual: 51_200 },
	],
};

interface DemoBond {
	serial: string;
	project: DemoProject;
	amount: number;
	investedDaysAgo: number;
	paidQuarters: number;
}

const DEMO_BONDS: DemoBond[] = [
	{
		serial: "GS-DEMO-1001",
		project: P_CHILLER,
		amount: 100_000_000,
		investedDaysAgo: 330,
		paidQuarters: 4,
	},
	{
		serial: "GS-DEMO-1002",
		project: P_MOTOR,
		amount: 75_000_000,
		investedDaysAgo: 260,
		paidQuarters: 3,
	},
	{
		serial: "GS-DEMO-1003",
		project: P_AIR,
		amount: 60_000_000,
		investedDaysAgo: 180,
		paidQuarters: 1,
	},
	{
		serial: "GS-DEMO-1004",
		project: P_CHILLER,
		amount: 50_000_000,
		investedDaysAgo: 150,
		paidQuarters: 2,
	},
];
const DEMO_FUNDED_BY_PROJECT: Record<number, number> = {
	[P_CHILLER.id]: 150_000_000,
	[P_MOTOR.id]: 75_000_000,
	[P_AIR.id]: 60_000_000,
};


function bondSummary(bond: DemoBond, index: number): BondSummary {
	const quarterly = Math.round(
		(bond.amount * (bond.project.irr / 100)) / 4,
	);
	const investedAt = iso(bond.investedDaysAgo);
	return {
		id: 90_000 + index,
		projectId: bond.project.id,
		amount: bond.amount,
		roiPaid: quarterly * bond.paidQuarters,
		status: "active",
		bondSerialNumber: bond.serial,
		investedAt,
	};
}

function demoDetail(bond: DemoBond, index: number): PortfolioDetail {
	const investment = bondSummary(bond, index);
	const quarterly = Math.round(
		(bond.amount * (bond.project.irr / 100)) / 4,
	);
	const totalQuarters = bond.project.paybackPeriod * 4;
	const invested = new Date(investment.investedAt ?? DEMO_NOW_MS);
	const payments = Array.from({ length: totalQuarters }, (_, q) => {
		const quarter = q + 1;
		const due = addMonths(invested, quarter * 3);
		const isPaid = quarter <= bond.paidQuarters;
		return {
			id: 900_000 + index * 100 + quarter,
			amount: quarterly,
			period: periodOf(due),
			status: isPaid ? ("paid" as const) : ("scheduled" as const),
			escrowTxId: isPaid
				? `ESC-SBX-DEMO-${String(index + 1).padStart(2, "0")}-${String(quarter).padStart(2, "0")}`
				: null,
			paidAt: isPaid ? new Date(due.getTime() - 5 * 86_400_000).toISOString() : null,
		};
	});

	const reports = (EMISSIONS[bond.project.id] ?? []).map((seed, reportIndex) => ({
		id: 800_000 + bond.project.id + reportIndex,
		periodStart: iso(seed.daysEnd + 90),
		periodEnd: iso(seed.daysEnd),
		emissionReduction: Math.round(((seed.baseline - seed.actual) * 0.79) / 10) / 100,
		actualConsumption: seed.actual,
		baselineConsumption: seed.baseline,
		anomalyFlagged: seed.anomaly ?? false,
	}));

	return {
		investment,
		project: {
			id: bond.project.id,
			title: bond.project.title,
			status: bond.project.status,
			industrySector: bond.project.industrySector,
			location: bond.project.location,
			targetEmissionReduction: bond.project.targetEmissionReduction,
			estimatedEnergySaving: bond.project.estimatedEnergySaving,
		},
		blueprint: {
			irr: bond.project.irr,
			npv: bond.project.npv,
			paybackPeriod: bond.project.paybackPeriod,
		},
		payments,
		emissionReports: reports,
	};
}

const DEMO: Array<{ item: PortfolioItem; detail: PortfolioDetail }> =
	DEMO_BONDS.map((bond, index) => {
		const detail = demoDetail(bond, index);
		return {
			item: {
				investment: detail.investment,
				project: detail.project,
				blueprint: detail.blueprint,
			},
			detail,
		};
	});

export const DEMO_PORTFOLIO: PortfolioItem[] = DEMO.map((entry) => entry.item);

/** Aligned with DEMO_PORTFOLIO by index. */
export const DEMO_DETAILS: PortfolioDetail[] = DEMO.map((entry) => entry.detail);
export const DEMO_MARKET = [P_CHILLER, P_MOTOR, P_AIR].map((project) => ({
	id: project.id,
	title: project.title,
	companyName:
		project.id === P_CHILLER.id
			? "PT Tekstil Nusantara Tbk"
			: project.id === P_MOTOR.id
				? "PT Logam Presisi Timur"
				: "PT Sinar Pangan Abadi",
	industrySector: project.industrySector,
	location: project.location,
	budget: project.budget,
	riskScore:
		project.id === P_CHILLER.id
			? 24
			: project.id === P_MOTOR.id
				? 18
				: 31,
	targetEmissionReduction: project.targetEmissionReduction,
	estimatedEnergySaving: project.estimatedEnergySaving,
	funded: DEMO_FUNDED_BY_PROJECT[project.id] ?? 0,
	fundingProgress: (DEMO_FUNDED_BY_PROJECT[project.id] ?? 0) / project.budget,
	blueprint: {
		irr: project.irr,
		npv: project.npv,
		paybackPeriod: project.paybackPeriod,
	},
}));
