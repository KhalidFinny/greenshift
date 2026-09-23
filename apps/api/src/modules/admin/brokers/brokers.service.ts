import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import {
	applyBrokerVerification,
	findBrokerForVerification,
} from "./brokers.repository";

export type VerifyBrokerResult =
	| { ok: true }
	| { ok: false; reason: "not_found" };

/**
 * Applies a broker licence decision: verifying clears any previous rejection
 * reason, rejecting stores the trimmed one and audits the reason as submitted.
 */
export async function verifyBroker(
	db: GreenShiftDb,
	input: {
		id: number;
		verified: boolean;
		rejectionReason: string | undefined;
		actorId: number;
	},
): Promise<VerifyBrokerResult> {
	const broker = await findBrokerForVerification(db, input.id);
	if (!broker) return { ok: false, reason: "not_found" };

	await applyBrokerVerification(db, {
		id: input.id,
		verified: input.verified,
		actorId: input.actorId,
		from: iso(broker.verifiedAt),
		rejectionReason: input.verified
			? null
			: (input.rejectionReason?.trim() ?? null),
		to: input.verified ? "verified" : input.rejectionReason,
	});
	return { ok: true };
}
