import { createDb } from "../../../db";
import type { Env } from "../../../env";
import { verifyPassword } from "../../../lib/password";
import { elevateSession, STEP_UP_TTL_MS } from "../../../lib/session";
import { findCredentialsById, insertAuditLog } from "./step-up.repository";

export type StepUpResult =
	| { status: "ok"; elevatedUntil: number }
	| { status: "invalid-session" }
	| { status: "incorrect-password" };

export interface StepUpInput {
	userId: number;
	sessionToken: string;
	password: string;
}

export async function stepUpUser(
	env: Env,
	input: StepUpInput,
): Promise<StepUpResult> {
	const db = createDb(env.DB);

	const user = await findCredentialsById(db, input.userId);
	if (!user?.hashedPassword) return { status: "invalid-session" };
	if (!(await verifyPassword(input.password, user.hashedPassword))) {
		return { status: "incorrect-password" };
	}

	const elevatedUntil = Date.now() + STEP_UP_TTL_MS;
	await elevateSession(env, input.sessionToken, elevatedUntil);
	await insertAuditLog(db, {
		userId: input.userId,
		action: "auth.step_up",
		entityType: "session",
		entityId: input.userId,
		metadata: { elevatedUntil: new Date(elevatedUntil).toISOString() },
	});

	return { status: "ok", elevatedUntil };
}
