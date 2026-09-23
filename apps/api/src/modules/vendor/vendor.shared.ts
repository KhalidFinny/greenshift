import { eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../db";
import { auditLogs, vendors } from "../../db/schema";

// Caps shared by more than one vendor feature.
export const MAX_SPEC_LENGTH = 5000;
export const MAX_WARRANTY_MONTHS = 240;

/** Vendor profile id for an authenticated user, or null when none exists yet. */
export async function vendorProfileId(
	db: GreenShiftDb,
	userId: number,
): Promise<number | null> {
	const [profile] = await db
		.select({ id: vendors.id })
		.from(vendors)
		.where(eq(vendors.userId, userId))
		.limit(1);
	return profile?.id ?? null;
}

export async function recordAudit(
	db: GreenShiftDb,
	entry: typeof auditLogs.$inferInsert,
): Promise<void> {
	await db.insert(auditLogs).values(entry);
}

export {
	evidenceEntry,
	forecastEntry,
	milestoneEntry,
	monthlyReportEntry,
} from "./vendor.delivery";
export { getProposalDetail, revisionEntry } from "./vendor.proposal";
export { isTenderVisibleTo, tenderSummary } from "./vendor.tender";
