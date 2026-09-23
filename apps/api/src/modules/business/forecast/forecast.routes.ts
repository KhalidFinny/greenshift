/* The ROI forecast the review step shows, for the project as the company has
 * entered it so far. The figures travel, the scenarios come back: the same
 * engine the blueprint is generated with, asked before there is a project to
 * generate one for.
 */

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

// ── the project's own blueprint ───────────────────────────
/**
 * The Green Project Blueprint the company's own page shows beside its summary.
 * It is written at verification, so a project still waiting on its LVV body
 * answers with null and the page says when it will exist.
 *
 * The vendor read is the one behind a gate: a bidder only sees a validated or
 * published document, while the company reads its own at whatever stage it has
 * reached.
 */
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

/** The body as this route will read it, or null when it is not one. */
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

/**
 * Eleanor's reading of the same forecast, asked for on its own: the scenarios
 * are arithmetic and land at once, so the charts do not wait on a model while
 * she writes about them. The figures travel rather than the scenarios, because
 * the engine and the cache key both read the same inputs the forecast does.
 */
forecastRoutes.post(
	"/review/forecast/reading",
	mutationRateLimit("business", "project-forecast-reading"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const body = readForecastRequest(await c.req.json().catch(() => null));
		if (body === null) return apiError(c, "VALIDATION");

		const forecast = roiForecast(body);
		// The panel asks for the reading only once it has a forecast to read, so
		// figures that produce none are an incomplete request and not a state.
		if (forecast === null) return apiError(c, "VALIDATION");

		const reading = await forecastReading(c.env, forecast);
		return c.json({ reading });
	}),
);
