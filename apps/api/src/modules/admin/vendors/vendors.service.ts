import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import {
	applyVendorVerification,
	findVendorForVerification,
} from "./vendors.repository";

export type VerifyVendorResult =
	| { ok: true }
	| { ok: false; reason: "not_found" };

/**
 * Applies a vendor certification decision and records it in the audit trail.
 */
export async function verifyVendor(
	db: GreenShiftDb,
	input: { id: number; verified: boolean; actorId: number },
): Promise<VerifyVendorResult> {
	const vendor = await findVendorForVerification(db, input.id);
	if (!vendor) return { ok: false, reason: "not_found" };

	await applyVendorVerification(db, {
		id: input.id,
		verified: input.verified,
		actorId: input.actorId,
		from: iso(vendor.verifiedAt),
	});
	return { ok: true };
}
