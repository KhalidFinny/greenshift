import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import {
	applyUserVerification,
	findUserForVerification,
} from "./users.repository";

export type VerifyUserResult =
	| { ok: true }
	| { ok: false; reason: "not_found" }
	| { ok: false; reason: "admin_locked" };

/**
 * Applies a verification decision to a user. Admin accounts can never be
 * unverified.
 */
export async function verifyUser(
	db: GreenShiftDb,
	input: { id: number; verified: boolean; actorId: number },
): Promise<VerifyUserResult> {
	const user = await findUserForVerification(db, input.id);
	if (!user) return { ok: false, reason: "not_found" };
	if (user.role === "admin" && input.verified === false) {
		return { ok: false, reason: "admin_locked" };
	}

	await applyUserVerification(db, {
		id: input.id,
		verified: input.verified,
		actorId: input.actorId,
		from: iso(user.verifiedAt),
	});
	return { ok: true };
}
