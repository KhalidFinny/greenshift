/**
 * Broker-facing bond code.
 *
 * An issued bond carries the code its broker registered, and the API returns it
 * verbatim. A bond that has not been issued yet has no code, so we fall back to
 * a deterministic value derived from the project: never random, or the investor
 * could not find the same bond twice.
 */
export function bondCodeFor(project: {
	id: number;
	bondCode?: string | null;
}): string {
	if (project.bondCode) return project.bondCode;
	return `GS-BND-${String(project.id).padStart(4, "0")}`;
}

/**
 * Plain-text payload for the "Copy Code" button.
 *
 * Investors paste this into the broker app's search field, so it carries the
 * code plus just enough context (name, issuer) to disambiguate. The coupon is
 * not included: the terms of the issuance belong to the partner app, which is
 * where the investor reads them.
 */
export function bondSearchPayload(project: {
	id: number;
	title: string;
	bondCode?: string | null;
	companyName?: string | null;
}): string {
	const lines = [
		`Bond Code: ${bondCodeFor(project)}`,
		`Name: ${project.title}`,
	];
	if (project.companyName) lines.push(`Issuer: ${project.companyName}`);
	return lines.join("\n");
}
