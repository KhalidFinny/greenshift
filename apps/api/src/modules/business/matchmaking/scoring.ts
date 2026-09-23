// The matching model's tables: the five criteria, and the provinces the location term reads.

// Weights follow the vendor-selection literature (Dickson's ordering), plus a risk term: 25/23/20/19/13.
export const MATCH_CRITERIA = [
	{ key: "technicalFit", label: "Technical Fit", weight: 25 },
	{ key: "relevantExperience", label: "Relevant Experience", weight: 23 },
	{ key: "historicalPerformance", label: "Historical Performance", weight: 20 },
	{ key: "priceValue", label: "Price & Value", weight: 19 },
	{ key: "projectRisk", label: "Project Risk", weight: 13 },
] as const;

export type MatchCriterionKey = (typeof MATCH_CRITERIA)[number]["key"];

export const MATCH_WEIGHTS = Object.fromEntries(
	MATCH_CRITERIA.map((criterion) => [criterion.key, criterion.weight]),
) as Record<MatchCriterionKey, number>;

// A criterion every vendor scores the same on is left out of the total and the rest renormalised.
export function separatingCriteria(
	rows: Array<Record<MatchCriterionKey, number>>,
): MatchCriterionKey[] {
	if (rows.length === 0) return [];
	return MATCH_CRITERIA.map((criterion) => criterion.key).filter(
		(key) => new Set(rows.map((row) => row[key])).size > 1,
	);
}

/** Projects delivered for full marks on relevant experience. */
export const EXPERIENCE_REFERENCE = 20;
/** Ratings are out of five, so this is what a full rating is worth. */
export const MAX_RATING = 5;
/** Projects delivered for full marks on the portfolio half of value. */
export const PORTFOLIO_REFERENCE = 15;
/** Where the value blend sits: half what the vendor delivers, half where from. */
export const VALUE_PORTFOLIO_SHARE = 0.5;

// Full marks in the project's own province, 70 next door on the same island, 45 elsewhere, 20 when unrecorded.
export function proximityScore(
	vendorLocation: string | null,
	projectLocation: string | null,
): number {
	const vendor = provinceOf(vendorLocation);
	const project = provinceOf(projectLocation);
	if (vendor === null || project === null) return 20;
	if (vendor === project) return 100;
	return NEIGHBOURING_PROVINCES[vendor]?.[project] === true ? 70 : 45;
}

export function provinceOf(location: string | null): string | null {
	if (!location) return null;
	const haystack = location.toLowerCase();
	for (const province of PROVINCES) {
		if (haystack.includes(province)) return province;
	}
	return null;
}

/** The provinces the seeded and entered locations use. */
export const PROVINCES = [
	"dki jakarta",
	"jawa barat",
	"jawa tengah",
	"di yogyakarta",
	"jawa timur",
	"banten",
	"bali",
	"sumatera utara",
	"sumatera selatan",
	"kepulauan riau",
	"kalimantan timur",
	"sulawesi selatan",
] as const;

/** Which provinces sit next to which: Java is one corridor, the rest stand alone. */
const JAVA = [
	"dki jakarta",
	"banten",
	"jawa barat",
	"jawa tengah",
	"di yogyakarta",
	"jawa timur",
];
const NEIGHBOURING_PROVINCES: Record<
	string,
	Record<string, true>
> = Object.fromEntries(
	JAVA.map((province) => [
		province,
		Object.fromEntries(
			JAVA.filter((other) => other !== province).map((other) => [other, true]),
		),
	]),
);
