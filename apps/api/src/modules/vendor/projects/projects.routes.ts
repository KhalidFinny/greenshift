import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { parseLimit } from "../../../lib/format";
import { apiError, apiNotFound } from "../../../lib/response";
import { getMarketProject, listMarketProjects } from "./projects.service";

const factory = createFactory<ApiEnv>();

export const projectsRoutes = new Hono<ApiEnv>();

projectsRoutes.get(
	"/projects",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const tenderStatus = c.req.query("status");
		if (
			tenderStatus &&
			!["open", "evaluation", "closed", "awarded"].includes(tenderStatus)
		) {
			return apiError(c, "VALIDATION", "Invalid tender status");
		}
		const limit = parseLimit(c.req.query("limit"));

		const projects = await listMarketProjects(
			db,
			c.get("user").id,
			tenderStatus,
			limit,
		);
		return c.json({ projects });
	}),
);

projectsRoutes.get(
	"/projects/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const project = await getMarketProject(db, c.get("user").id, id);
		if (!project) {
			return apiNotFound(c, "Project");
		}
		return c.json({ project });
	}),
);
