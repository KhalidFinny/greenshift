import type { BusinessProfile } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import {
	type CompanyProfileRow,
	type CompanyProfileValues,
	findCompanyProfile,
	writeCompanyProfile,
} from "./profile.repository";

/** What a save may carry, as the route validates and passes it. */
export type { CompanyProfileValues };

function toBusinessProfile(row: CompanyProfileRow): BusinessProfile {
	return {
		id: row.id,
		companyName: row.companyName,
		representative: row.name,
		industrySector: row.industrySector,
		address: row.address,
		contactEmail: row.email,
		contactPhone: row.phone,
		updatedAt: iso(row.updatedAt),
	};
}

/** Null when the session's account row is gone, which the route reports. */
export async function getBusinessProfile(
	db: GreenShiftDb,
	userId: number,
): Promise<BusinessProfile | null> {
	const row = await findCompanyProfile(db, userId);
	return row ? toBusinessProfile(row) : null;
}

// Reads back through the same mapper, so the screen renders the stored values.
export async function saveBusinessProfile(
	db: GreenShiftDb,
	userId: number,
	values: CompanyProfileValues,
): Promise<BusinessProfile | null> {
	await writeCompanyProfile(db, userId, values);
	return getBusinessProfile(db, userId);
}
