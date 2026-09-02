import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema.ts";

export * from "./schema.ts";

export type GreenShiftDb = DrizzleD1Database<typeof schema>;

export function createDb(binding: D1Database): GreenShiftDb {
	return drizzle(binding, { schema });
}
