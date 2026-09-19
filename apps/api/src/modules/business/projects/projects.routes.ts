import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { BusinessSubmitBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { parseLimit } from "../../../lib/format";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { listProjects, submitProject } from "./projects.service";

const factory = createFactory<ApiEnv>();

export const projectsRoutes = new Hono<ApiEnv>();

// ── submit ────────────────────────────────────────────────
// Creates the project while consuming its draft and scoring it, which is why
// it reads as an action rather than a collection POST.
projectsRoutes.post(
	"/projects/submit",
	mutationRateLimit("business", "submit"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as BusinessSubmitBody | null;
		if (body === null || typeof body !== "object") {
			return apiError(c, "VALIDATION");
		}

		const db = createDb(c.env.DB);
		const result = await submitProject(db, c.get("user").id, body);

		if (result.outcome === "not_found") return apiNotFound(c, "Draft");
		if (result.outcome === "conflict") {
			return apiError(
				c,
				"CONFLICT",
				`This draft was already submitted as project ${result.projectId}.`,
				{ projectId: result.projectId },
			);
		}
		if (result.outcome === "invalid") {
			return apiError(c, "VALIDATION", result.message, {
				fields: result.fields,
			});
		}

		return apiSuccess(c, { project: result.project }, "Project submitted", 201);
	}),
);

// ── list ──────────────────────────────────────────────────
projectsRoutes.get(
	"/projects",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const projects = await listProjects(
			db,
			c.get("user").id,
			parseLimit(c.req.query("limit")),
		);

		return c.json({ projects });
	}),
);
