import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { VendorPortfolioBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidNumber } from "../../../lib/format";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import {
	addVendorPortfolioItem,
	listVendorPortfolio,
	removeVendorPortfolioItem,
} from "./portfolio.service";

const factory = createFactory<ApiEnv>();

export const portfolioRoutes = new Hono<ApiEnv>();

const MAX_TEXT_LENGTH = 2000;

portfolioRoutes.get(
	"/portfolio",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const portfolio = await listVendorPortfolio(db, c.get("user").id);
		return c.json({ portfolio });
	}),
);

portfolioRoutes.post(
	"/portfolio",
	mutationRateLimit("vendor", "portfolio"),
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as VendorPortfolioBody | null;
		const projectName = body?.projectName?.trim();
		const clientName = body?.clientName?.trim();
		const projectValue = body?.projectValue;

		if (
			!projectName ||
			!clientName ||
			projectName.length > 200 ||
			clientName.length > 200 ||
			typeof projectValue !== "number" ||
			!Number.isFinite(projectValue) ||
			projectValue <= 0 ||
			invalidNumber(body?.durationMonths, {
				integer: true,
				min: 0,
				max: 600,
			}) ||
			invalidNumber(body?.energySavingPercent, { min: 0, max: 100 }) ||
			invalidNumber(body?.carbonReductionTons, { min: 0 }) ||
			invalidNumber(body?.completionYear, {
				integer: true,
				min: 1900,
				max: 2200,
			}) ||
			(body?.description !== undefined &&
				(typeof body.description !== "string" ||
					body.description.length > MAX_TEXT_LENGTH)) ||
			(body?.servicesProvided !== undefined &&
				(typeof body.servicesProvided !== "string" ||
					body.servicesProvided.length > MAX_TEXT_LENGTH))
		) {
			return apiError(c, "VALIDATION", "Invalid portfolio item");
		}

		const db = createDb(c.env.DB);
		const result = await addVendorPortfolioItem(db, c.get("user").id, {
			projectName,
			clientName,
			projectValue,
			details: body,
		});
		if (result.status === "no_profile") {
			return apiError(
				c,
				"VALIDATION",
				"Complete your vendor profile before adding portfolio items",
			);
		}
		if (result.status === "insert_failed") {
			return apiError(c, "INTERNAL", "Failed to add item");
		}
		return apiSuccess(
			c,
			{ item: result.item },
			"Changes saved successfully",
			201,
		);
	}),
);

portfolioRoutes.delete(
	"/portfolio/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const result = await removeVendorPortfolioItem(db, c.get("user").id, id);
		if (result.status === "not_found") {
			return apiNotFound(c, "Portfolio item");
		}
		return apiSuccess(c, { ok: true }, "Changes saved successfully");
	}),
);
