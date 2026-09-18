import { Database } from "bun:sqlite";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { hashPassword } from "../apps/api/src/lib/password";

// Locates the local D1 SQLite file that the Cloudflare Vite plugin creates
// under .wrangler/state/v3/d1 and seeds the demo users. Migrations are applied
// by wrangler (migrations_dir in wrangler.jsonc) when the dev server starts,
// so this script only adds users. Idempotent: safe to re-run.
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

// Seed demo users (idempotent: only inserts users that don't exist yet).
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
