import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { parseLimit } from "../../../lib/format";
import { apiError, apiNotFound } from "../../../lib/response";
import {
	getMyProject,
	listMyProjects,
	listProcurementStatus,
} from "./participation.service";

const factory = createFactory<ApiEnv>();

export const participationRoutes = new Hono<ApiEnv>();

participationRoutes.get(
	"/my-projects",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const projects = await listMyProjects(db, c.get("user").id, limit);
		return c.json({ projects });
	}),
);

participationRoutes.get(
	"/my-projects/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const project = await getMyProject(db, c.get("user").id, id);
		if (!project) {
			return apiNotFound(c, "Project");
		}
		return c.json({ project });
	}),
);

participationRoutes.get(
	"/procurement-status",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const items = await listProcurementStatus(db, c.get("user").id, limit);
		return c.json({ items });
	}),
);
