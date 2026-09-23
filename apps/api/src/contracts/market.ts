import type { BusinessRiskInsight } from "./business-risk";

export interface BlueprintSummary {
	irr?: number;
	npv?: number;
	paybackPeriod?: number;
}

/** The three scenarios the engine runs; the keys are the ones every screen reads. */
export const forecastScenarioKeys = [
	"conservative",
	"base",
	"optimistic",
] as const;
export type ForecastScenarioKey = (typeof forecastScenarioKeys)[number];

export interface ForecastScenario {
	key: ForecastScenarioKey;
	/** What the screen calls it: "Conservative", "Base Case", "Optimistic". */
	label: string;
	/** Share of the planned annual saving the scenario assumes, in percent. */
	savingPct: number;
	/** Annual energy-price inflation applied to the saving, in percent. */
	inflationPct: number;
	/** Annual asset degradation applied to the saving, in percent. */
	degradationPct: number;
	/** The saving the scenario starts from, in rupiah per year. */
	firstYearSavingRp: number;
	npvRp: number;
	/** Null when the cash flows never repay the capital at any rate. */
	irrPct: number | null;
	/** Years to recover the capital at the first-year saving. */
	paybackYears: number | null;
	/** Capital recovered per year, the capital itself at index zero, ending at `npvRp`. */
	recoveryRp: number[];
}

/** The three scenarios, with the base case lifted to the top level. */
export interface RoiForecast {
	/** The money the scenarios are recovering, as Step 2 entered it. */
	capexRp: number;
	/** The rate the cash flows are discounted at, in percent. */
	discountRatePct: number;
	/** How many years the cash flows run for: the funding's own tenor. */
	horizonYears: number;
	npvRp: number;
	irrPct: number | null;
	paybackYears: number | null;
	scenarios: ForecastScenario[];
}

export interface BusinessForecastRequest {
	capexRp: number | null;
	tenorTahun: number | null;
	penghematanRp: number | null;
	pendapatanRp: number | null;
}

/** `forecast` is null while the figures are incomplete. */
export interface BusinessForecastResponse {
	forecast: RoiForecast | null;
}

/** Asked for separately from the figures: the arithmetic lands at once, she takes a moment. */
export interface BusinessForecastReadingResponse {
	reading: BusinessRiskInsight;
}

/** How the project is funded: the bond the blueprint hands to the SCF partner. */
export interface BlueprintFundingStructure {
	instrument: "green_bond";
	capexRp: number;
	tenorYears: number;
	annualSavingRp: number;
	annualRevenueRp: number | null;
	/** The collateral the company offered, in the words it entered. */
	collateral: string | null;
}

/** What the project promises to cut, against the measured baseline. */
export interface BlueprintEmissionTargets {
	baselineTco2: number;
	targetPct: number;
	targetTco2: number;
	energySavingKwh: number;
}

/** Every field is optional: the JSON column holds a document at whatever stage it reached. */
export interface BlueprintFinancialProjections {
	npv?: number;
	irr?: number | null;
	paybackPeriod?: number | null;
	discountRatePct?: number;
	horizonYears?: number;
	scenarios?: ForecastScenario[];
}

/** The case LVV GRK validates and the SCF partner issues against; sections are optional by stage. */
export interface BlueprintDocument {
	fundingStructure?: BlueprintFundingStructure;
	emissionTargets?: BlueprintEmissionTargets;
	financialProjections?: BlueprintFinancialProjections;
}

/** A bidder reads it only once it is validated. */
export interface ProjectBlueprintView extends BlueprintSummary {
	status: string;
	validatedAt: string | null;
	/** The rate the document discounts at, and the years it runs for. */
	discountRatePct: number | null;
	horizonYears: number | null;
	fundingStructure: BlueprintFundingStructure | null;
	emissionTargets: BlueprintEmissionTargets | null;
	/** Each case carries its own `recoveryRp` series: what the projection chart plots. */
	scenarios: ForecastScenario[];
}

/** What the MRV periods cut, against what the blueprint promised. */
export interface BondMonitoring {
	/** Tonnes of CO2e the verified MRV periods add up to. */
	verifiedTco2: number;
	periods: number;
	/** The latest reported period, "YYYY-MM". */
	latestPeriod: string | null;
	/** True when a verified period deviated from its baseline. */
	anomalyFlagged: boolean;
}

/** `verified` mirrors an OJK-cleared bond brokers can list; `on_progress` is still in audit. */
export const bondStatuses = ["verified", "on_progress"] as const;
export type BondStatus = (typeof bondStatuses)[number];

/** Recorded from the broker's assignment; every field is optional by stage. */
export interface BondTerms {
	/** The capital the bond raises. */
	amount: number | null;
	tenorMonths: number | null;
	couponRatePercent: number | null;
	issuanceDate: string | null;
	maturityDate: string | null;
	/** The broker's own external issuance status. */
	status: string | null;
}

/** What GreenShift measures; issuance and money belong to the SCF partner. */
export interface BondListing {
	id: number;
	title: string;
	/** Broker-facing code investors search for in Trima+/IPOT. */
	bondCode: string | null;
	companyName: string | null;
	industrySector: string | null;
	location: string | null;
	riskScore: number | null;
	targetEmissionReduction: number | null;
	estimatedEnergySaving: number | null;
	status: BondStatus;
	verifiedAt: string | null;
	monitoring: BondMonitoring;
	/** The published blueprint: the funding case, the targets and the projections. */
	blueprint: ProjectBlueprintView | null;
	/** The terms behind the listing, or null while nothing has been issued. */
	bondTerms: BondTerms | null;
}

export interface BondMarketResponse {
	bonds: BondListing[];
}
