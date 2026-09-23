// The ROI forecast the review step shows, asked before a project exists to carry one.

import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { BusinessForecastRequest } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound } from "../../../lib/response";
import * as projectsRepository from "../projects/projects.repository";
import { roiForecast } from "./forecast.engine";
import { readProjectBlueprint } from "./forecast.service";
import { forecastReading } from "./forecast-reading.service";

const factory = createFactory<ApiEnv>();

export const forecastRoutes = new Hono<ApiEnv>();

// A bidder only sees the blueprint once it is validated or published.
forecastRoutes.get(
	"/projects/:id/blueprint",
	...factory.createHandlers(async (c) => {
		const raw = c.req.param("id");
		if (!raw || !/^\d+$/.test(raw)) return apiError(c, "INVALID_ID");

		const db = createDb(c.env.DB);
		const project = await projectsRepository.findCompanyProject(
			db,
			Number(raw),
			c.get("user").id,
		);
		if (!project) return apiNotFound(c, "Project");

		return c.json({ blueprint: await readProjectBlueprint(db, project.id) });
	}),
);

/** A tenor beyond this is a typo, not a project. */
const MAX_TENOR_YEARS = 100;

function readNumber(value: unknown, max: number): number | null | undefined {
	if (value === null || value === undefined) return null;
	if (typeof value === "number" && Number.isFinite(value) && value <= max) {
		return value;
	}
	return undefined;
}

function readForecastRequest(raw: unknown): BusinessForecastRequest | null {
	if (typeof raw !== "object" || raw === null) return null;
	const body = raw as Record<string, unknown>;

	const capexRp = readNumber(body.capexRp, Number.MAX_SAFE_INTEGER);
	const tenorTahun = readNumber(body.tenorTahun, MAX_TENOR_YEARS);
	const penghematanRp = readNumber(body.penghematanRp, Number.MAX_SAFE_INTEGER);
	const pendapatanRp = readNumber(body.pendapatanRp, Number.MAX_SAFE_INTEGER);

	if (
		capexRp === undefined ||
		tenorTahun === undefined ||
		penghematanRp === undefined ||
		pendapatanRp === undefined
	) {
		return null;
	}

	return { capexRp, tenorTahun, penghematanRp, pendapatanRp };
}

forecastRoutes.post(
	"/review/forecast",
	mutationRateLimit("business", "project-forecast"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const body = readForecastRequest(await c.req.json().catch(() => null));
		if (body === null) return apiError(c, "VALIDATION");

		return c.json({ forecast: roiForecast(body) });
	}),
);

// Asked for separately so the charts do not wait on a model; the figures travel because the cache key reads them.
forecastRoutes.post(
	"/review/forecast/reading",
	mutationRateLimit("business", "project-forecast-reading"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const body = readForecastRequest(await c.req.json().catch(() => null));
		if (body === null) return apiError(c, "VALIDATION");

		const forecast = roiForecast(body);
		// Figures that produce no forecast are an incomplete request, not a state.
		if (forecast === null) return apiError(c, "VALIDATION");

		const reading = await forecastReading(c.env, forecast);
		return c.json({ reading });
	}),
);
