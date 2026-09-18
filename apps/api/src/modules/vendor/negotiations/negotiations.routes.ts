import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { VendorNegotiationResponseBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidNumber } from "../../../lib/format";
import { requireJson } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import {
	listVendorNegotiations,
	respondToVendorNegotiation,
} from "./negotiations.service";

const factory = createFactory<ApiEnv>();

export const negotiationRoutes = new Hono<ApiEnv>();

const MAX_NOTE_LENGTH = 2000;

negotiationRoutes.get(
	"/negotiations",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const negotiations = await listVendorNegotiations(db, c.get("user").id);
		return c.json({ negotiations });
	}),
);

negotiationRoutes.post(
	"/negotiations/:id/response",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit("vendor", "negotiation")(c);
		if (rateError) return rateError;

		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
		}

		const body = (await c.req
			.json()
			.catch(() => null)) as VendorNegotiationResponseBody | null;
		const revisedPrice = body?.revisedPrice;
		const revisedWarrantyYears = body?.revisedWarrantyYears;
		const revisedTimelineMonths = body?.revisedTimelineMonths;
		const note = body?.note;

		if (
			invalidNumber(revisedPrice, { min: 0 }) ||
			invalidNumber(revisedWarrantyYears, {
				integer: true,
				min: 0,
				max: 50,
			}) ||
			invalidNumber(revisedTimelineMonths, {
				integer: true,
				min: 0,
				max: 120,
			}) ||
			(note !== undefined &&
				(typeof note !== "string" || note.length > MAX_NOTE_LENGTH))
		) {
			return c.json(
				{
					error: { code: "VALIDATION", message: "Invalid negotiation input" },
				},
				400,
			);
		}

		const db = createDb(c.env.DB);
		const result = await respondToVendorNegotiation(db, c.get("user").id, id, {
			revisedPrice,
			revisedWarrantyYears,
			revisedTimelineMonths,
			note,
		});

		if (result.status === "not_found") {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Negotiation not found" } },
				404,
			);
		}
		if (result.status === "invalid_state") {
			return c.json(
				{
					error: {
						code: "INVALID_STATE",
						message: "This negotiation has already been answered",
					},
				},
				409,
			);
		}
		if (result.status === "load_failed") {
			return c.json(
				{ error: { code: "INTERNAL", message: "Failed to load negotiation" } },
				500,
			);
		}
		return c.json({ negotiation: result.negotiation });
	}),
);
