import type { AuthUser } from "@greenshift/core";
import { createDb } from "../../../db";
import type { Env } from "../../../env";
import { authUserFrom } from "../../../lib/authz";
import {
	hashPassword,
	passwordNeedsRehash,
	verifyPassword,
} from "../../../lib/password";
import { createSession } from "../../../lib/session";
import { findUserByEmail, updatePasswordHash } from "./login.repository";

export type LoginResult =
	| { status: "ok"; user: AuthUser; token: string }
	| { status: "invalid-credentials" };

// Verified against one stable dummy hash when the account is missing or has no
// password, so the response time does not reveal which emails exist.
let dummyHashPromise: Promise<string> | null = null;

export async function loginUser(
	env: Env,
	email: string,
	password: string,
): Promise<LoginResult> {
	const db = createDb(env.DB);
	const user = await findUserByEmail(db, email);

	if (!user?.hashedPassword) {
		dummyHashPromise ??= hashPassword("dummy-password");
		await verifyPassword(password, await dummyHashPromise);
		return { status: "invalid-credentials" };
	}
	if (!(await verifyPassword(password, user.hashedPassword))) {
		return { status: "invalid-credentials" };
	}

	if (passwordNeedsRehash(user.hashedPassword)) {
		await updatePasswordHash(db, user.id, await hashPassword(password));
	}

	const authUser = authUserFrom(user);
	const token = await createSession(env, authUser.id);
	return { status: "ok", user: authUser, token };
}
