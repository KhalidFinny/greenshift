import type { BrokerProfileBody } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { auditLogs } from "../../../db/schema";
import {
	type BrokerProfileRow,
	type BrokerProfileValues,
	profileUpsert,
	userCompanyNameUpdate,
} from "./profile.repository";

/**
 * Saves the firm profile and, when licence data is filed, records the
 * submission for verification. Self-service registration (§6): the broker can
 * never verify itself.
 */
export async function saveBrokerProfile(
	db: GreenShiftDb,
	userId: number,
	body: BrokerProfileBody,
): Promise<BrokerProfileRow> {
	// Filing licence data counts as a verification submission.
	const filedLicence =
		typeof body.financialLicenseNumber === "string" &&
		body.financialLicenseNumber.trim().length > 0;

	const values: BrokerProfileValues = {
		companyName: body.companyName.trim(),
		description: body.description ?? null,
		representative: body.representative ?? null,
		contactEmail: body.contactEmail ?? null,
		contactPhone: body.contactPhone ?? null,
		website: body.website ?? null,
		address: body.address ?? null,
		nib: body.nib ?? null,
		financialLicenseNumber: body.financialLicenseNumber ?? null,
		licenseAuthority: body.licenseAuthority ?? null,
	};

	const [saved] = await profileUpsert(
		db,
		userId,
		values,
		filedLicence ? new Date() : null,
	);

	await db.batch([
		userCompanyNameUpdate(db, userId, values.companyName),
		db.insert(auditLogs).values({
			userId,
			action: filedLicence
				? "broker.verification_submitted"
				: "broker.profile_updated",
			entityType: "broker_profile",
			entityId: saved.id,
			metadata: { companyName: values.companyName },
		}),
	]);

	return saved;
}
