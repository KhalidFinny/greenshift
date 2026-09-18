import { Hono } from "hono";
import type { AdminProject, UpdateStatusBody } from "../../../contracts";
import { createDb } from "../../../db";
import { projectStatuses } from "../../../db/schema";
import type { ApiEnv } from "../../../env";
import { requireRecentStepUp } from "../../../lib/authz";
import { parseLimit } from "../../../lib/format";
import { requireJson } from "../../../lib/http";
import { factory } from "../admin.shared";
import { listProjects } from "./projects.repository";
import { changeProjectStatus } from "./projects.service";

export const projectRoutes = new Hono<ApiEnv>();

projectRoutes.get(
	"/projects",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const status = c.req.query("status");
		if (status && !(projectStatuses as readonly string[]).includes(status)) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid status" } },
				400,
			);
		}
		const limit = parseLimit(c.req.query("limit"));

		const rows = await listProjects(db, status, limit);

		const list: AdminProject[] = rows.map(
			({ project, companyName, blueprintStatus }) => ({
				id: project.id,
				title: project.title,
				status: project.status,
				companyName,
				industrySector: project.industrySector,
				budget: project.budget,
				riskScore: project.riskScore,
				blueprintStatus,
			}),
		);
		return c.json({ projects: list });
	}),
);

projectRoutes.patch(
	"/projects/:id/status",
	requireRecentStepUp,
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<UpdateStatusBody> | null;
		const status = body?.status;
		if (
			!Number.isInteger(id) ||
			id <= 0 ||
			typeof status !== "string" ||
			!(projectStatuses as readonly string[]).includes(status)
		) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid input" } },
				400,
			);
		}

		const result = await changeProjectStatus(createDb(c.env.DB), {
			id,
			status: status as (typeof projectStatuses)[number],
			actorId: c.get("user").id,
		});
		if (!result.ok) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Project not found" } },
				404,
			);
		}
		return c.json({ ok: true });
	}),
);
