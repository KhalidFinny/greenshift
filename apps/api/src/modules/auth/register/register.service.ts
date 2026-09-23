import type { AuthUser, OrganizationType } from "@greenshift/core";
import { createDb } from "../../../db";
import type { Env } from "../../../env";
import { authUserFrom } from "../../../lib/authz";
import { hashPassword } from "../../../lib/password";
import { createSession } from "../../../lib/session";
import {
	findUserIdByEmail,
	insertRegisteredAccount,
	type UserRow,
} from "./register.repository";

export interface RegisterInput {
	accountType: OrganizationType;
	name: string;
	email: string;
	password: string;
	phone: string;
	organizationName: string;
	industry: string;
	address: string;
	businessInfo: string | null;
	nib: string | null;
	npwp: string | null;
}

export type RegisterResult =
	| {
			status: "ok";
			user: AuthUser;
			token: string;
			accountType: OrganizationType;
	  }
	| { status: "email-taken" };

// Creates the account and the organization it represents, then opens the session,
// so one submission leaves a usable account of the chosen type.
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
		user = await insertRegisteredAccount(db, { ...input, hashedPassword });
	} catch (err) {
		if (String(err).includes("UNIQUE constraint")) {
			return { status: "email-taken" };
		}
		throw err;
	}

	const authUser = authUserFrom(user);
	const token = await createSession(env, authUser.id);
	return {
		status: "ok",
		user: authUser,
		token,
		accountType: input.accountType,
	};
}
