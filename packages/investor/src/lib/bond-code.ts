import { formatIdr } from "./format";

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
 * code plus just enough context (name, issuer, coupon) to disambiguate:
 * without turning the clipboard into a data dump.
 */
export function bondSearchPayload(project: {
	id: number;
	title: string;
	bondCode?: string | null;
	companyName?: string | null;
	blueprint?: { irr?: number };
}): string {
	const lines = [
		`Bond Code: ${bondCodeFor(project)}`,
		`Name: ${project.title}`,
	];
	if (project.companyName) lines.push(`Issuer: ${project.companyName}`);
	const coupon = project.blueprint?.irr;
	if (typeof coupon === "number") {
		lines.push(
			`Coupon: ${coupon.toLocaleString("en-US", { maximumFractionDigits: 1 })}% p.a.`,
		);
	}
	return lines.join("\n");
}

/** One-line description of the bond used in the checkout sheet header. */
export function bondSummaryLine(project: {
	title: string;
	budget?: number | null;
}): string {
	return `${project.title} · target ${formatIdr(project.budget ?? 0)}`;
}
