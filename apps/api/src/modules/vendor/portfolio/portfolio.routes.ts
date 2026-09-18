import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { VendorPortfolioBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidNumber } from "../../../lib/format";
import { requireJson } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
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
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit("vendor", "portfolio")(c);
		if (rateError) return rateError;

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
			return c.json(
				{
					error: { code: "VALIDATION", message: "Invalid portfolio item" },
				},
				400,
			);
		}

		const db = createDb(c.env.DB);
		const result = await addVendorPortfolioItem(db, c.get("user").id, {
			projectName,
			clientName,
			projectValue,
			details: body,
		});
		if (result.status === "no_profile") {
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message:
							"Complete your vendor profile before adding portfolio items",
					},
				},
				400,
			);
		}
		if (result.status === "insert_failed") {
			return c.json(
				{ error: { code: "INTERNAL", message: "Failed to add item" } },
				500,
			);
		}
		return c.json({ item: result.item }, 201);
	}),
);

portfolioRoutes.delete(
	"/portfolio/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const result = await removeVendorPortfolioItem(db, c.get("user").id, id);
		if (result.status === "not_found") {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Portfolio item not found" } },
				404,
			);
		}
		return c.json({ ok: true });
	}),
);
