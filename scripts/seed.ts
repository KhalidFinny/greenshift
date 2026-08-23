import { hashPassword } from "../apps/api/src/lib/password";

const users = [
	{ username: "business1", name: "PT Green Nusantara", role: "business" },
	{ username: "investor1", name: "Green Fund Capital", role: "investor" },
	{ username: "vendor1", name: "EcoTech Solutions", role: "vendor" },
	{ username: "admin", name: "Administrator", role: "admin" },
] as const;

const PASSWORD = "12345678";

const lines = await Promise.all(
	users.map(async (user) => {
		const hash = await hashPassword(PASSWORD);
		const values = [
			`'${user.username}@greenshift.dev'`,
			`'${user.role}'`,
			`'${user.name}'`,
			`'${hash}'`,
			"(strftime('%s','now')*1000)",
			"(strftime('%s','now')*1000)",
		].join(", ");
		return `INSERT INTO users (email, role, name, hashed_password, created_at, updated_at) VALUES (${values});`;
	}),
);

console.log(lines.join("\n"));
