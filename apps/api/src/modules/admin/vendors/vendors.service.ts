import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import {
	applyVendorVerification,
	findVendorForVerification,
} from "./vendors.repository";

export type VerifyVendorResult =
	| { ok: true }
	| { ok: false; reason: "not_found" }
	| { ok: false; reason: "pack_not_filed" };

/**
 * Applies a vendor certification decision and records it in the audit trail.
 * Verification needs the pack on file (tax number, registration number, certificate).
 */
export async function verifyVendor(
	db: GreenShiftDb,
	input: {
		id: number;
		verified: boolean;
		actorId: number;
		rejectionReason?: string | null;
	},
): Promise<VerifyVendorResult> {
	const vendor = await findVendorForVerification(db, input.id);
	if (!vendor) return { ok: false, reason: "not_found" };
	if (
		input.verified &&
		(!vendor.npwp ||
			!vendor.tdp ||
			(vendor.certifications ?? []).length === 0 ||
			!vendor.certificateKey)
	) {
		return { ok: false, reason: "pack_not_filed" };
	}

	await applyVendorVerification(db, {
		id: input.id,
		verified: input.verified,
		actorId: input.actorId,
		from: iso(vendor.verifiedAt),
		rejectionReason: input.rejectionReason ?? null,
	});
	return { ok: true };
}
