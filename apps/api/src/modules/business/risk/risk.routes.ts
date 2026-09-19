import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { apiError, apiNotFound } from "../../../lib/response";
import * as repository from "../projects/projects.repository";
import { readProjectRisk } from "./risk.service";

const factory = createFactory<ApiEnv>();

export const riskRoutes = new Hono<ApiEnv>();

// ── risk read ─────────────────────────────────────────────
// Mirrors the frontend's `ProjectRiskResult`, so the assessment card renders it
// without a mapper in between.
riskRoutes.get(
	"/projects/:id/risk",
	...factory.createHandlers(async (c) => {
		const raw = c.req.param("id");
		if (!raw || !/^\d+$/.test(raw)) return apiError(c, "INVALID_ID");
		const projectId = Number(raw);

		const db = createDb(c.env.DB);
		const project = await repository.findCompanyProject(
			db,
			projectId,
			c.get("user").id,
		);
		if (!project) return apiNotFound(c, "Project");

		const result = await readProjectRisk(db, projectId, c.get("user").id);
		if (result.outcome === "not_found") {
			return apiNotFound(c, "Risk assessment");
		}

		return c.json({ risk: result.risk });
	}),
);
