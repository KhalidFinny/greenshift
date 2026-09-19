/* Bundled under public/kecamatan; same-origin fetch, no CORS, offline-safe once deployed. */
export const DISTRICT_CSV = "/kecamatan/";

export function titleCase(s: string): string {
	return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/* Pure builder: CSV texts -> "Kecamatan, Kabupaten/Kota, Provinsi" labels. */
export function buildDistrictLabels(
	dText: string,
	rText: string,
	pText: string,
): string[] {
	const [dRows, rRows, pRows] = [dText, rText, pText].map((text) =>
		text
			.split("\n")
			.map((line) => line.trim().split(","))
			.filter((cells) => cells.length >= 2 && cells[0]),
	);
	const regByCode: Record<string, string> = {};
	for (const [code, , name] of rRows) regByCode[code] = name ?? "";
	const provByCode: Record<string, string> = {};
	for (const [code, name] of pRows) provByCode[code] = name ?? "";
	const labels: string[] = [];
	for (const [, regCode, name] of dRows) {
		if (!name) continue;
		const regName = regByCode[regCode] ?? "";
		const provName = provByCode[regCode.slice(0, 2)] ?? "";
		if (!regName || !provName) continue;
		labels.push(
			`${titleCase(name)}, ${titleCase(regName)}, ${titleCase(provName)}`,
		);
	}
	return labels;
}

/* Thin fetch wrapper over the pure builder. */
export async function loadDistricts(): Promise<string[]> {
	const [d, r, p] = await Promise.all(
		["districts.csv", "regencies.csv", "provinces.csv"].map(async (f) => {
			const res = await fetch(DISTRICT_CSV + f);
			if (!res.ok) throw new Error(f);
			return res.text();
		}),
	);
	return buildDistrictLabels(d, r, p);
}
