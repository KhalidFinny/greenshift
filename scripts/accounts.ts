import { hashPassword } from "../apps/api/src/lib/password";

/** Demo accounts shared by the setup scripts (`bun run db:setup`). */
export const DEMO_PASSWORD = "12345678";

export interface DemoAccount {
	username: string;
	name: string;
	role: "business" | "investor" | "vendor" | "broker" | "admin";
	companyName: string | null;
	/** The organization's sector and address, for accounts that are a company. */
	industrySector?: string;
	address?: string;
}

/**
 * Ten companies, ten vendors, one investor, five brokers and one administrator.
 * The first company and the first vendor carry the curated demo story in
 * `scripts/seed.ts`; the rest give every list a realistic population (admin user
 * and vendor tables, the vendor leaderboard, per-broker dashboards) and, together
 * with the ten vendors, a procurement web in which every company ranks a real
 * field of bidders. The addresses are province-qualified because the matchmaking
 * model compares the vendor's province with the project's.
 *
 * `investor1` is a data placeholder rather than a login the demo hands out: the
 * platform has no investor surface (the bond is bought and held in the partner
 * app), but the investment and ROI fixtures join `users` on `investor_id`, so one
 * row has to exist for the admin's investment and payout screens to have
 * anything in them.
 *
 * A name is the person; `companyName` is the organization they represent, which
 * is what every list shows as the account's company.
 */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
	{ username: "business1", name: "Rangga Wibisono", role: "business", companyName: "PT Green Nusantara", industrySector: "Textile", address: "Malang, Jawa Timur" },
	{ username: "business2", name: "Sinta Maharani", role: "business", companyName: "PT Sinar Abadi Textile", industrySector: "Textile", address: "Bandung, Jawa Barat" },
	{ username: "business3", name: "Yusuf Hidayat", role: "business", companyName: "PT Pangan Utama", industrySector: "Food and beverage", address: "Sidoarjo, Jawa Timur" },
	{ username: "business4", name: "Ratna Kusuma", role: "business", companyName: "PT Semen Nusantara", industrySector: "Cement", address: "Gresik, Jawa Timur" },
	{ username: "business5", name: "Agus Prakoso", role: "business", companyName: "PT Agro Industri Nusantara", industrySector: "Agriculture", address: "Pasuruan, Jawa Timur" },
	{ username: "business6", name: "Bambang Sutrisno", role: "business", companyName: "PT Kertas Nusantara", industrySector: "Pulp and paper", address: "Karawang, Jawa Barat" },
	{ username: "business7", name: "Dedi Kurniawan", role: "business", companyName: "PT Baja Prima", industrySector: "Iron and steel", address: "Cilegon, Banten" },
	{ username: "business8", name: "Maya Puspita", role: "business", companyName: "PT Graha Sentra Properti", industrySector: "Commercial buildings", address: "Jakarta, DKI Jakarta" },
	{ username: "business9", name: "Iwan Susanto", role: "business", companyName: "PT Sawit Lestari", industrySector: "Agriculture", address: "Batam, Kepulauan Riau" },
	{ username: "business10", name: "Nur Aini", role: "business", companyName: "PT Tekstil Jaya", industrySector: "Textile", address: "Surakarta, Jawa Tengah" },

	{ username: "investor1", name: "Green Fund Capital", role: "investor", companyName: "Green Fund Capital" },

	{ username: "vendor1", name: "Andi Saputra", role: "vendor", companyName: "EcoTech Solutions" },
	{ username: "vendor2", name: "Dewi Anggraini", role: "vendor", companyName: "PT Eco Power Indonesia" },
	{ username: "vendor3", name: "Bayu Nugroho", role: "vendor", companyName: "PT Bio Thermal Energy" },
	{ username: "vendor4", name: "Lestari Widodo", role: "vendor", companyName: "PT Solar Cipta Energi" },
	{ username: "vendor5", name: "Fajar Ramadhan", role: "vendor", companyName: "PT Efisiensi Mesin Nusantara" },
	{ username: "vendor6", name: "Komang Aditya", role: "vendor", companyName: "PT Sinar Energi Terang" },
	{ username: "vendor7", name: "Sri Wahyuni", role: "vendor", companyName: "PT Karya Efisiensi Industri" },
	{ username: "vendor8", name: "Yoga Pratama", role: "vendor", companyName: "PT Mitra Kendali Termal" },
	{ username: "vendor9", name: "Andi Tenri", role: "vendor", companyName: "PT Cahaya Teknik Mandiri" },
	{ username: "vendor10", name: "Gunawan Wibowo", role: "vendor", companyName: "PT Rekayasa Termal Nusantara" },

	{ username: "broker1", name: "Budi Santoso", role: "broker", companyName: "Capital Green Securities" },
	{ username: "broker2", name: "Rina Hartati", role: "broker", companyName: "Nusantara Sekuritas Hijau" },
	{ username: "broker3", name: "Hendra Gunawan", role: "broker", companyName: "Mitra Obligasi Indonesia" },
	{ username: "broker4", name: "Clara Wijaya", role: "broker", companyName: "Pacific Sustainable Capital" },
	{ username: "broker5", name: "Teguh Prasetya", role: "broker", companyName: "Graha Green Underwriters" },

	{ username: "admin1", name: "Administrator", role: "admin", companyName: null },
];

/** Accounts the broker-stage fixtures rely on. */
export const BROKER_STAGE_ACCOUNTS = ["broker1", "vendor2", "vendor3"] as const;

export function emailFor(username: string): string {
	return `${username}@greenshift.dev`;
}

/**
 * The legal identity a seeded company is verified against. Deterministic, so a
 * reseed produces the same numbers, and shaped like the real documents: a
 * 13-digit business identification number and a 15-digit tax number.
 */
function legalIdentityFor(account: DemoAccount): { nib: string; npwp: string } {
	const index = DEMO_ACCOUNTS.indexOf(account) + 1;
	const nib = `9120${String(index).padStart(4, "0")}${String(100000 + index).slice(-6)}`.slice(
		0,
		13,
	);
	const npwp = `01.${String(200 + index).padStart(3, "0")}.${String(300 + index).padStart(3, "0")}.${String(index % 9)}-${String(400 + index).padStart(3, "0")}.000`;
	return { nib, npwp };
}

/**
 * One account row as SQL. Idempotent (`ON CONFLICT(email) DO NOTHING`), so the
 * same statement creates a missing login and never touches an existing one, so the same statement
 * locally through `bun run db:setup`, remotely through
 * `bun scripts/seed-accounts.ts > scripts/accounts.sql` piped into
 * `wrangler d1 execute --remote`.
 *
 * A seeded company is a company that has already been through the gate: its
 * pack is on file and an administrator has verified it, which is what the
 * procurement fixtures behind it assume. A newly registered company starts at
 * the verification step instead, and the platform holds it there until an
 * administrator has looked at the same pack.
 */
export function accountStatement(account: DemoAccount, hash: string): string {
	const company = account.role === "business";
	const identity = company ? legalIdentityFor(account) : null;
	const values = [
		`'${emailFor(account.username)}'`,
		`'${account.role}'`,
		`'${account.name}'`,
		`'${hash}'`,
		account.companyName ? `'${account.companyName}'` : "NULL",
		account.industrySector ? `'${account.industrySector}'` : "NULL",
		account.address ? `'${account.address}'` : "NULL",
		identity ? `'${identity.nib}'` : "NULL",
		identity ? `'${identity.npwp}'` : "NULL",
		company ? "'VERIFIED'" : "'NOT_VERIFIED'",
		company ? "(strftime('%s','now') - 30*86400)*1000" : "NULL",
		company ? "(strftime('%s','now') - 29*86400)*1000" : "NULL",
		"(strftime('%s','now')*1000)",
		"(strftime('%s','now')*1000)",
	].join(", ");
	return `INSERT INTO users (email, role, name, hashed_password, company_name, industry_sector, address, nib, npwp, verification_state, legal_docs_submitted_at, verified_at, created_at, updated_at) VALUES (${values}) ON CONFLICT(email) DO NOTHING;`;
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
