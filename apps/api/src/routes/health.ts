import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { Env } from "../env";

const factory = createFactory<{ Bindings: Env }>();

export const healthRoutes = new Hono<{ Bindings: Env }>();

healthRoutes.get(
	"/health",
	...factory.createHandlers(async (c) => {
		const env = c.env;
		const checks: Record<string, { status: "ok" | "error"; error?: string }> =
			{};

		try {
			await env.DB.prepare("SELECT 1").first();
			checks.d1 = { status: "ok" };
		} catch (err) {
			checks.d1 = { status: "error", error: String(err) };
		}

		try {
			await env.KV.put("health:check", "ok", { expirationTtl: 60 });
			const value = await env.KV.get("health:check");
			await env.KV.delete("health:check");
			checks.kv =
				value === "ok"
					? { status: "ok" }
					: { status: "error", error: "roundtrip mismatch" };
		} catch (err) {
			checks.kv = { status: "error", error: String(err) };
		}

		try {
			await env.R2.put("health/check.txt", "ok");
			const object = await env.R2.head("health/check.txt");
			await env.R2.delete("health/check.txt");
			checks.r2 = object
				? { status: "ok" }
				: { status: "error", error: "head returned null" };
		} catch (err) {
			checks.r2 = { status: "error", error: String(err) };
		}

		const allOk = Object.values(checks).every((check) => check.status === "ok");
		return c.json({
			status: allOk ? "ok" : "degraded",
			checks,
			timestamp: new Date().toISOString(),
		});
	}),
);
