import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Database } from "bun:sqlite";

/**
 * Locates the local D1 SQLite file that the Cloudflare Vite plugin creates under
 * `.wrangler/state/v3/d1`. Migrations are applied by Wrangler (migrations_dir in
 * wrangler.jsonc) when the dev server starts, so the setup scripts only add rows.
 */
export const D1_DIR = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";

export function openLocalD1(): Database {
	const candidates = existsSync(D1_DIR)
		? readdirSync(D1_DIR).filter(
				(file) => file.endsWith(".sqlite") && !file.startsWith("metadata"),
			)
		: [];

	if (candidates.length === 0) {
		console.error(
			"No local D1 database found. Run `bun run dev` once first so the Vite plugin creates it, then re-run this script.",
		);
		process.exit(1);
	}
	return new Database(join(D1_DIR, candidates[0]));
}

export function tableExists(db: Database, table: string): boolean {
	const row = db
		.query("SELECT count(*) AS c FROM sqlite_master WHERE type='table' AND name=?")
		.get(table) as { c: number } | null;
	return (row?.c ?? 0) > 0;
}
