import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../db";
import type { Env } from "../env";

const factory = createFactory<{ Bindings: Env }>();

export const healthRoutes = new Hono<{ Bindings: Env }>();

// Read-only probes only: no KV/R2 writes (avoids unauthenticated write
// amplification) and no error-string leakage (details go to server logs).
healthRoutes.get(
	"/health",
	...factory.createHandlers(async (c) => {
		const env = c.env;
		const checks: Record<string, { status: "ok" | "error" }> = {};

		try {
			await createDb(env.DB).run(sql`select 1`);
			checks.d1 = { status: "ok" };
		} catch (err) {
			console.error("[health] d1", err);
			checks.d1 = { status: "error" };
		}

		try {
			await env.KV.get("health:check");
			checks.kv = { status: "ok" };
		} catch (err) {
			console.error("[health] kv", err);
			checks.kv = { status: "error" };
		}

		try {
			await env.R2.head("health/check.txt");
			checks.r2 = { status: "ok" };
		} catch (err) {
			console.error("[health] r2", err);
			checks.r2 = { status: "error" };
		}

		const allOk = Object.values(checks).every((check) => check.status === "ok");
		return c.json({
			status: allOk ? "ok" : "degraded",
			checks,
			timestamp: new Date().toISOString(),
		});
	}),
);
