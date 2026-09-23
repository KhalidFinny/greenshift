/* The matching model's own tables: the five criteria a vendor pool is scored on,
 * and the provinces its location term reads.
 *
 * Declared apart from the run so everything that has to agree about the model
 * reads one table: the run that computes the scores, the read that renormalises
 * the weights the screen shows, and the seed, whose fixtures have to produce a
 * ranking a re-run would reproduce.
 */

/**
 * What the matching run scores: each criterion, the words the screen shows it
 * under, and what it is worth. One table, so the run, the stored rows and the
 * screen cannot disagree about the model.
 *
 * The weights follow the vendor-selection literature rather than a house
 * preference: Dickson's survey of purchasing managers rates quality 3.51,
 * delivery 3.42, performance history 3.00 and price 2.76 on a five-point scale,
 * which is the ordering quality > delivery > history > price that procurement
 * scoring has kept since. Those four are normalised over a risk term of 2.0,
 * which this platform adds because it finances the project as well as buys from
 * the vendor. The result: 25 / 23 / 20 / 19 / 13.
 */
export const MATCH_CRITERIA = [
	{ key: "technicalFit", label: "Technical Fit", weight: 25 },
	{ key: "relevantExperience", label: "Relevant Experience", weight: 23 },
	{ key: "historicalPerformance", label: "Historical Performance", weight: 20 },
	{ key: "priceValue", label: "Price & Value", weight: 19 },
	{ key: "projectRisk", label: "Project Risk", weight: 13 },
] as const;

export type MatchCriterionKey = (typeof MATCH_CRITERIA)[number]["key"];

/** The weights on their own, for the total. */
export const MATCH_WEIGHTS = Object.fromEntries(
	MATCH_CRITERIA.map((criterion) => [criterion.key, criterion.weight]),
) as Record<MatchCriterionKey, number>;

/**
 * The criteria that separate a pool: a criterion every vendor scores the same on
 * says nothing about the difference between them, so it is left out of the total
 * and the remaining weights are renormalised over it. Exported because the read
 * applies the same rule to the stored rows, so the weights the screen shows are
 * the ones the score was actually built from.
 */
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

/**
 * How close a vendor works to the project. Compared on the province the two
 * locations name, which is the granularity both sides record: full marks in the
 * project's own province, 70 in a neighbouring province on the same island, 45
 * elsewhere in the country, and 20 when the location is not on file.
 */
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

/** The province a location string names, lowercased, or null if it names none. */
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
