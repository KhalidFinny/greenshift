import { eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, users } from "../../../db/schema";

export type CompanyProfileRow = typeof users.$inferSelect;

// Only the company name is required; the other keys are written when the request
// carried them, so a form that changes one field keeps the rest as registered.
export interface CompanyProfileValues {
	companyName: string;
	representative?: string;
	industrySector?: string | null;
	address?: string | null;
	contactPhone?: string | null;
}

export async function findCompanyProfile(
	db: GreenShiftDb,
	userId: number,
): Promise<CompanyProfileRow | undefined> {
	const [row] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return row;
}

/** The account row and its audit entry in one batch, so neither lands alone. */
export function writeCompanyProfile(
	db: GreenShiftDb,
	userId: number,
	values: CompanyProfileValues,
) {
	const update: Partial<typeof users.$inferInsert> = {
		companyName: values.companyName,
	};
	if (values.representative !== undefined) update.name = values.representative;
	if (values.industrySector !== undefined)
		update.industrySector = values.industrySector;
	if (values.address !== undefined) update.address = values.address;
	if (values.contactPhone !== undefined) update.phone = values.contactPhone;

	return db.batch([
		db.update(users).set(update).where(eq(users.id, userId)),
		db.insert(auditLogs).values({
			userId,
			action: "business.profile_updated",
			entityType: "user",
			entityId: userId,
		}),
	]);
}
