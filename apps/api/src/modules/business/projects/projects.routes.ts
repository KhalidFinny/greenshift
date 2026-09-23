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
	checkEnvironmentalRegistry,
	completeLvvReview,
	listProjects,
	readProject,
	startLvvVerification,
	submitProject,
} from "./projects.service";

const factory = createFactory<ApiEnv>();

export const projectsRoutes = new Hono<ApiEnv>();

// Creates the project while consuming its draft and scoring it, so it reads as an action, not a collection POST.
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

// The body's review runs out of band, so this answers the project the company marked registered.
projectsRoutes.post(
	"/projects/:id/lvv",
	mutationRateLimit("business", "start-lvv"),
	...factory.createHandlers(async (c) => {
		const raw = c.req.param("id");
		if (!raw || !/^\d+$/.test(raw)) return apiError(c, "INVALID_ID");

		const db = createDb(c.env.DB);
		const companyId = c.get("user").id;
		const result = await startLvvVerification(db, companyId, Number(raw));

		if (result.outcome === "not_found") return apiNotFound(c, "Project");
		if (result.outcome === "conflict") {
			return apiError(
				c,
				"CONFLICT",
				"This project is not waiting to be registered for verification.",
			);
		}

		c.executionCtx.waitUntil(
			completeLvvReview(db, companyId, result.project.id, result.project.title),
		);

		return apiSuccess(
			c,
			{ project: result.project },
			"LVV verification started",
		);
	}),
);

// The figures are the stored ones rather than a second derivation in the browser.
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

// Registration at Sistem Registri is off-platform, so reading it back lets the page prompt the company.
projectsRoutes.get(
	"/projects/:id/registry",
	...factory.createHandlers(async (c) => {
		const raw = c.req.param("id");
		if (!raw || !/^\d+$/.test(raw)) return apiError(c, "INVALID_ID");

		const db = createDb(c.env.DB);
		const project = await readProject(db, c.get("user").id, Number(raw));
		if (!project) return apiNotFound(c, "Project");

		const registry = await checkEnvironmentalRegistry(project.title);
		return c.json({ registered: registry.registered });
	}),
);

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
