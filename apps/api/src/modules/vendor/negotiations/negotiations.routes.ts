import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { VendorNegotiationResponseBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidNumber } from "../../../lib/format";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
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
	mutationRateLimit("vendor", "negotiation"),
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
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
			return apiError(c, "VALIDATION", "Invalid negotiation input");
		}

		const db = createDb(c.env.DB);
		const result = await respondToVendorNegotiation(db, c.get("user").id, id, {
			revisedPrice,
			revisedWarrantyYears,
			revisedTimelineMonths,
			note,
		});

		if (result.status === "not_found") {
			return apiNotFound(c, "Negotiation");
		}
		if (result.status === "invalid_state") {
			return apiError(
				c,
				"INVALID_STATE",
				"This negotiation has already been answered",
			);
		}
		if (result.status === "load_failed") {
			return apiError(c, "INTERNAL", "Failed to load negotiation");
		}
		return apiSuccess(
			c,
			{ negotiation: result.negotiation },
			"Changes saved successfully",
		);
	}),
);
