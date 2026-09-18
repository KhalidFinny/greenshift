import { eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { brokerProfiles, users } from "../../../db/schema";

export type BrokerProfileRow = typeof brokerProfiles.$inferSelect;

export interface BrokerProfileValues {
	companyName: string;
	description: string | null;
	representative: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	website: string | null;
	address: string | null;
	nib: string | null;
	financialLicenseNumber: string | null;
	licenseAuthority: string | null;
}

/** The broker profile is created lazily on first read so settings always work. */
export async function loadProfile(
	db: GreenShiftDb,
	userId: number,
): Promise<BrokerProfileRow | undefined> {
	const [existing] = await db
		.select()
		.from(brokerProfiles)
		.where(eq(brokerProfiles.userId, userId))
		.limit(1);
	return existing;
}

export async function createProfile(
	db: GreenShiftDb,
	userId: number,
	companyName: string,
): Promise<BrokerProfileRow> {
	const [created] = await db
		.insert(brokerProfiles)
		.values({ userId, companyName })
		.returning();
	return created;
}

/**
 * Upsert the firm profile. `submission` is set when licence data was filed, which
 * records the verification submission and clears any earlier rejection.
 */
export function profileUpsert(
	db: GreenShiftDb,
	userId: number,
	values: BrokerProfileValues,
	submission: Date | null,
) {
	return db
		.insert(brokerProfiles)
		.values({ userId, ...values, submittedAt: submission })
		.onConflictDoUpdate({
			target: brokerProfiles.userId,
			set: {
				...values,
				...(submission
					? { submittedAt: submission, rejectionReason: null }
					: {}),
			},
		})
		.returning();
}

export function userCompanyNameUpdate(
	db: GreenShiftDb,
	userId: number,
	companyName: string,
) {
	return db.update(users).set({ companyName }).where(eq(users.id, userId));
}
