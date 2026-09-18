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
 * Applies a broker licence decision. A verified broker clears any previous
 * rejection reason; a rejection stores the trimmed reason and the audit trail
 * keeps the reason exactly as submitted.
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
