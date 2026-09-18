import { BROKER_STAGE_ACCOUNTS, emailFor } from "./accounts";
import { openLocalD1, tableExists } from "./local-d1";
import { buildSeed } from "./seed";
import { seedAccounts } from "./setup-db";

/**
 * Applies only the broker-stage fixtures to the existing local database.
 *
 * Non-destructive and safe to re-run: missing accounts are created, the fixture
 * statements run in one transaction, and the whole group is skipped once a
 * broker profile exists. This is the path to use when the database already holds
 * the accounts and vendor/bond fixtures - loading the full `scripts/seed.sql`
 * into an existing database conflicts on the fixed account emails.
 *
 * To wipe everything instead, delete `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`
 * and re-apply migrations + the full seed; that drops every local row.
 */
const db = openLocalD1();

if (!tableExists(db, "broker_assignments")) {
	console.error(
		"The broker tables do not exist yet. Restart the dev server (or run\n" +
			"`bunx wrangler d1 migrations apply greenshift-db --local`) so migration 0003 is applied,\n" +
			"then re-run `bun run db:setup:broker`.",
	);
	process.exit(1);
}

const brokerAccounts = new Set(
	BROKER_STAGE_ACCOUNTS.map((username) => emailFor(username)),
);
const companyExists =
	(db
		.query("SELECT count(*) AS c FROM users WHERE email = ?")
		.get("business1@greenshift.dev") as { c: number } | null)?.c ?? 0;
if (companyExists === 0) {
	console.error(
		"The company account business1@greenshift.dev is missing; run `bun run db:setup` first.",
	);
	process.exit(1);
}

// The fixture statements reference these accounts by email.
const before = new Set(
	(db.query("SELECT email FROM users").all() as { email: string }[]).map(
		(row) => row.email,
	),
);
const missing = [...brokerAccounts].filter((email) => !before.has(email));
db.close();

if (missing.length > 0) {
	const { created } = await seedAccounts(BROKER_STAGE_ACCOUNTS);
	for (const email of created) console.log(`Created account ${email}`);
}

const db2 = openLocalD1();
// The broker fixtures attach to projects the earlier seed groups create.
const missingProjects = [
	"Biomass Boiler",
	"Factory Chiller Retrofit",
	"Electric Motor Efficiency",
].filter(
	(title) =>
		((db2
			.query("SELECT count(*) AS c FROM projects WHERE title = ?")
			.get(title) as { c: number } | null)?.c ?? 0) === 0,
);
if (missingProjects.length > 0) {
	console.error(
		`These projects are missing, so the broker fixtures cannot attach to them: ${missingProjects.join(", ")}.\n` +
			"Load the fixtures into a fresh database instead: delete\n" +
			"`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`, restart the dev server, then run\n" +
			"`bun run db:setup` and `bunx wrangler d1 execute greenshift-db --local --file=scripts/seed.sql`.",
	);
	db2.close();
	process.exit(1);
}

const existingBroker =
	(db2.query("SELECT count(*) AS c FROM broker_profiles").get() as {
		c: number;
	} | null)?.c ?? 0;
if (existingBroker > 0) {
	console.log("Broker fixtures are already present; nothing to do.");
	db2.close();
	process.exit(0);
}

const { broker } = await buildSeed();

// One statement per entry; drop the terminator for bun:sqlite. The whole group
// runs in a single transaction so a failure leaves no partial fixtures behind.
db2.run("BEGIN");
try {
	for (const statement of broker) {
		db2.run(statement.replace(/;\s*$/, ""));
	}
	db2.run("COMMIT");
} catch (error) {
	db2.run("ROLLBACK");
	console.error("Failed to apply the broker fixtures; the transaction rolled back.");
	db2.close();
	throw error;
}

console.log(`Applied ${broker.length} broker fixture statements.`);
for (const [label, sql] of [
	["broker_profiles", "SELECT count(*) AS c FROM broker_profiles"],
	["broker_assignments", "SELECT count(*) AS c FROM broker_assignments"],
	["document_requests", "SELECT count(*) AS c FROM document_requests"],
	["project_milestones (project total)", "SELECT count(*) AS c FROM project_milestones"],
] as const) {
	const row = db2.query(sql).get() as { c: number } | null;
	console.log(`  ${label}: ${row?.c ?? 0} rows`);
}
console.log("Broker fixtures ready. Log in as broker1 / 12345678.");
db2.close();
