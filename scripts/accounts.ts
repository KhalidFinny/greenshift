import { hashPassword } from "../apps/api/src/lib/password";

/** Demo accounts shared by the setup scripts (`bun run db:setup`). */
export const DEMO_PASSWORD = "12345678";

export interface DemoAccount {
	username: string;
	name: string;
	role: "business" | "investor" | "vendor" | "broker" | "admin";
	companyName: string | null;
}

/**
 * Five accounts per role. The first of each role carries the curated demo story
 * in `scripts/seed.ts`; the rest give every list a realistic population
 * (admin user and vendor tables, the vendor leaderboard, per-broker dashboards).
 */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
	{ username: "business1", name: "PT Green Nusantara", role: "business", companyName: "PT Green Nusantara" },
	{ username: "business2", name: "PT Sinar Abadi Textile", role: "business", companyName: "PT Sinar Abadi Textile" },
	{ username: "business3", name: "PT Pangan Utama", role: "business", companyName: "PT Pangan Utama" },
	{ username: "business4", name: "PT Semen Nusantara", role: "business", companyName: "PT Semen Nusantara" },
	{ username: "business5", name: "PT Agro Industri Nusantara", role: "business", companyName: "PT Agro Industri Nusantara" },

	{ username: "investor1", name: "Green Fund Capital", role: "investor", companyName: "Green Fund Capital" },
	{ username: "investor2", name: "Meridian Climate Partners", role: "investor", companyName: "Meridian Climate Partners" },
	{ username: "investor3", name: "Nusantara Green Bonds", role: "investor", companyName: "Nusantara Green Bonds" },
	{ username: "investor4", name: "Asia Pacific Impact Fund", role: "investor", companyName: "Asia Pacific Impact Fund" },
	{ username: "investor5", name: "Blue Carbon Ventures", role: "investor", companyName: "Blue Carbon Ventures" },

	{ username: "vendor1", name: "EcoTech Solutions", role: "vendor", companyName: "EcoTech Solutions" },
	{ username: "vendor2", name: "Eco Power Indonesia", role: "vendor", companyName: "PT Eco Power Indonesia" },
	{ username: "vendor3", name: "Bio Thermal Energy", role: "vendor", companyName: "PT Bio Thermal Energy" },
	{ username: "vendor4", name: "Solar Cipta Energi", role: "vendor", companyName: "PT Solar Cipta Energi" },
	{ username: "vendor5", name: "Efisiensi Mesin Nusantara", role: "vendor", companyName: "PT Efisiensi Mesin Nusantara" },

	{ username: "broker1", name: "Capital Green Securities", role: "broker", companyName: "Capital Green Securities" },
	{ username: "broker2", name: "Nusantara Sekuritas Hijau", role: "broker", companyName: "Nusantara Sekuritas Hijau" },
	{ username: "broker3", name: "Mitra Obligasi Indonesia", role: "broker", companyName: "Mitra Obligasi Indonesia" },
	{ username: "broker4", name: "Pacific Sustainable Capital", role: "broker", companyName: "Pacific Sustainable Capital" },
	{ username: "broker5", name: "Graha Green Underwriters", role: "broker", companyName: "Graha Green Underwriters" },

	{ username: "admin1", name: "Administrator", role: "admin", companyName: null },
	{ username: "admin2", name: "Siti Rahmawati", role: "admin", companyName: null },
	{ username: "admin3", name: "Budi Prasetyo", role: "admin", companyName: null },
	{ username: "admin4", name: "Dewi Lestari", role: "admin", companyName: null },
	{ username: "admin5", name: "Andi Wijaya", role: "admin", companyName: null },
];

/** Accounts the broker-stage fixtures rely on. */
export const BROKER_STAGE_ACCOUNTS = ["broker1", "vendor2", "vendor3"] as const;

export function emailFor(username: string): string {
	return `${username}@greenshift.dev`;
}

/**
 * One account row as SQL. Idempotent (`ON CONFLICT(email) DO NOTHING`), so the
 * same statement creates a missing login and never touches an existing one, so the same statement
 * locally through `bun run db:setup`, remotely through
 * `bun scripts/seed-accounts.ts > scripts/accounts.sql` piped into
 * `wrangler d1 execute --remote`.
 */
export function accountStatement(account: DemoAccount, hash: string): string {
	const values = [
		`'${emailFor(account.username)}'`,
		`'${account.role}'`,
		`'${account.name}'`,
		`'${hash}'`,
		account.companyName ? `'${account.companyName}'` : "NULL",
		"(strftime('%s','now')*1000)",
		"(strftime('%s','now')*1000)",
	].join(", ");
	return `INSERT INTO users (email, role, name, hashed_password, company_name, created_at, updated_at) VALUES (${values}) ON CONFLICT(email) DO NOTHING;`;
}

/** Every demo account as SQL, with a fresh password hash per row. */
export async function buildAccountStatements(
	only?: readonly string[],
): Promise<string[]> {
	return Promise.all(
		DEMO_ACCOUNTS.filter(
			(account) => !only || only.includes(account.username),
		).map(async (account) =>
			accountStatement(account, await hashPassword(DEMO_PASSWORD)),
		),
	);
}
