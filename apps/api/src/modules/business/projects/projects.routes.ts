import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { BusinessSubmitBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { parseLimit } from "../../../lib/format";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import {
	completeLvvReview,
	listProjects,
	readProject,
	submitProject,
} from "./projects.service";

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

		// The file goes to a verification body, which answers later: the answer is
		// carried out of band so the response is the submission, not the review.
		c.executionCtx.waitUntil(
			completeLvvReview(
				db,
				c.get("user").id,
				result.project.id,
				result.project.title,
			),
		);

		return apiSuccess(c, { project: result.project }, "Project submitted", 201);
	}),
);

// ── read one ──────────────────────────────────────────────
// The confirmation page reads the project it just created, so the figures on it
// are the stored ones rather than a second derivation in the browser.
projectsRoutes.get(
	"/projects/:id",
	...factory.createHandlers(async (c) => {
		const raw = c.req.param("id");
		if (!raw || !/^\d+$/.test(raw)) return apiError(c, "INVALID_ID");

		const db = createDb(c.env.DB);
		const project = await readProject(db, c.get("user").id, Number(raw));
		if (!project) return apiNotFound(c, "Project");

		return c.json({ project });
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
