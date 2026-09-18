import type { AuthUser } from "@greenshift/core";
import { createDb } from "../../../db";
import type { Env } from "../../../env";
import { authUserFrom } from "../../../lib/authz";
import { hashPassword } from "../../../lib/password";
import { createSession } from "../../../lib/session";
import {
	findUserIdByEmail,
	insertUser,
	type UserRow,
} from "./register.repository";

export interface RegisterInput {
	name: string;
	email: string;
	password: string;
	companyName: string;
}

export type RegisterResult =
	| { status: "ok"; user: AuthUser; token: string }
	| { status: "email-taken" };

export async function registerUser(
	env: Env,
	input: RegisterInput,
): Promise<RegisterResult> {
	const db = createDb(env.DB);

	const existing = await findUserIdByEmail(db, input.email);
	if (existing) return { status: "email-taken" };

	const hashedPassword = await hashPassword(input.password);
	let user: UserRow;
	try {
		user = await insertUser(db, {
			email: input.email,
			name: input.name,
			companyName: input.companyName,
			hashedPassword,
			role: "business",
		});
	} catch (err) {
		if (String(err).includes("UNIQUE constraint")) {
			return { status: "email-taken" };
		}
		throw err;
	}

	const authUser = authUserFrom(user);
	const token = await createSession(env, authUser.id);
	return { status: "ok", user: authUser, token };
}
