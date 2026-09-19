import {
	accountStatement,
	DEMO_ACCOUNTS,
	DEMO_PASSWORD,
	emailFor,
} from "./accounts";
import { openLocalD1, tableExists } from "./local-d1";
import { hashPassword } from "../apps/api/src/lib/password";

/**
 * Creates any missing demo accounts in the local D1 database.
 *
 * Non-destructive and idempotent: accounts that already exist are skipped, so
 * re-running never touches existing rows. Sessions, MRV rows and any other local
 * data stay untouched.
 */
export async function seedAccounts(
	only?: readonly string[],
): Promise<{ created: string[]; skipped: string[] }> {
	const db = openLocalD1();
	const existing = new Set(
		(db.query("SELECT email FROM users").all() as { email: string }[]).map(
			(row) => row.email,
		),
	);

	const created: string[] = [];
	const skipped: string[] = [];
	for (const account of DEMO_ACCOUNTS) {
		if (only && !only.includes(account.username)) continue;
		const email = emailFor(account.username);
		if (existing.has(email)) {
			skipped.push(email);
			continue;
		}
		const hash = await hashPassword(DEMO_PASSWORD);
		db.run(accountStatement(account, hash));
		created.push(email);
	}
	db.close();
	return { created, skipped };
}

if (import.meta.main) {
	const db = openLocalD1();
	if (!tableExists(db, "users")) {
		console.error(
			"The users table does not exist yet. Run `bun run dev` once so the Vite plugin creates the database and applies the migrations, then re-run `bun run db:setup`.",
		);
		process.exit(1);
	}
	db.close();

	const { created, skipped } = await seedAccounts();
	for (const email of created) console.log(`Seeded ${email}`);
	console.log(
		created.length === 0
			? `All demo accounts already exist (${skipped.length} checked).`
			: `Created ${created.length} account(s); ${skipped.length} already existed.`,
	);
	console.log(
		"Database ready. Login with business1 / investor1 / vendor1 / broker1 / admin1 (password 12345678).",
	);
}
