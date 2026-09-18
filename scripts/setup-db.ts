import { Database } from "bun:sqlite";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hashPassword } from "../apps/api/src/lib/password";

// Locates the local D1 SQLite file that the Cloudflare Vite plugin creates
// under .wrangler/state/v3/d1, then applies the Drizzle migration and seeds
// the demo users. Idempotent: safe to re-run.
const D1_DIR = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";

const candidates = existsSync(D1_DIR)
	? readdirSync(D1_DIR).filter(
			(file) => file.endsWith(".sqlite") && !file.startsWith("metadata"),
		)
	: [];

if (candidates.length === 0) {
	console.error(
		"No local D1 database found. Run `bun run dev` once first so the Vite plugin creates it, then re-run `bun run db:setup`.",
	);
	process.exit(1);
}

const dbFile = join(D1_DIR, candidates[0]);
const db = new Database(dbFile);

// 1) Apply migrations (idempotent: skip when tables already exist).
const tableExists = db
	.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
	.get();

if (!tableExists) {
	const migration = readFileSync("drizzle/0000_broad_payback.sql", "utf8");
	// Drizzle separates statements with `--> statement-breakpoint`; SQLite
	// itself treats `--` as a line comment, so splitting on the marker is safe.
	const statements = migration
		.split("--> statement-breakpoint")
		.map((statement) => statement.trim())
		.filter(Boolean);

	db.exec("BEGIN");
	try {
		for (const statement of statements) db.run(statement);
		db.exec("COMMIT");
	} catch (err) {
		db.exec("ROLLBACK");
		throw err;
	}
	console.log(`Applied migration to ${dbFile}`);
} else {
	console.log("Migration already applied, skipping.");
}

// 2) Seed demo users (idempotent: only inserts users that don't exist yet).
const seed = [
	{ username: "business1", name: "PT Green Nusantara", role: "business" },
	{ username: "investor1", name: "Green Fund Capital", role: "investor" },
	{ username: "vendor1", name: "EcoTech Solutions", role: "vendor" },
	{ username: "broker1", name: "PT Capital Hijau Sekuritas", role: "broker" },
	{ username: "admin", name: "Administrator", role: "admin" },
] as const;

const PASSWORD = "12345678";
const existing = new Set(
	(
		db
			.query("SELECT email FROM users")
			.all() as { email: string }[]
	).map((row) => row.email),
);

for (const user of seed) {
	const email = `${user.username}@greenshift.dev`;
	if (existing.has(email)) continue;
	const hash = await hashPassword(PASSWORD);
	const now = Date.now();
	db.run(
		"INSERT INTO users (email, role, name, hashed_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
		email,
		user.role,
		user.name,
		hash,
		now,
		now,
	);
	console.log(`Seeded ${email} (${user.role})`);
}

console.log("Database ready. Login with business1 / investor1 / vendor1 / broker1 / admin (password 12345678).");
