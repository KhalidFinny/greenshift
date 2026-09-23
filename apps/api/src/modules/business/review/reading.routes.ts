/* The reading the review step opens with, for the project as entered so far. Same
 * shape as the risk insight: the figures travel, the analyst's words come back. */

import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { BusinessProjectReadingRequest } from "../../../contracts";
import type { ApiEnv } from "../../../env";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError } from "../../../lib/response";
import { projectReading } from "./reading.service";

const factory = createFactory<ApiEnv>();

export const readingRoutes = new Hono<ApiEnv>();

/** Free text that reaches a prompt is bounded, so a field cannot become a brief. */
const MAX_TEXT_CHARS = 200;
/** A tenor beyond this is a typo, not a project. */
const MAX_TENOR_YEARS = 100;

function readText(value: unknown): string | null {
	return typeof value === "string" && value.length <= MAX_TEXT_CHARS
		? value
		: null;
}

function readOptionalText(value: unknown): string | null | undefined {
	if (value === null) return null;
	return readText(value) ?? undefined;
}

function readOptionalNumber(
	value: unknown,
	max = Number.MAX_SAFE_INTEGER,
): number | null | undefined {
	if (value === null) return null;
	if (
		typeof value === "number" &&
		Number.isFinite(value) &&
		value >= 0 &&
		value <= max
	) {
		return value;
	}
	return undefined;
}

function readReadingRequest(
	raw: unknown,
): BusinessProjectReadingRequest | null {
	if (typeof raw !== "object" || raw === null) return null;
	const body = raw as Record<string, unknown>;

	const namaProyek = readText(body.namaProyek);
	const lokasi = readText(body.lokasi);
	const sektor = readText(body.sektor);
	const jaminan = readOptionalText(body.jaminan);
	const capexRp = readOptionalNumber(body.capexRp);
	const tenorTahun = readOptionalNumber(body.tenorTahun, MAX_TENOR_YEARS);
	const penghematanRp = readOptionalNumber(body.penghematanRp);
	const pendapatanRp = readOptionalNumber(body.pendapatanRp);

	if (
		namaProyek === null ||
		lokasi === null ||
		sektor === null ||
		jaminan === undefined ||
		capexRp === undefined ||
		tenorTahun === undefined ||
		penghematanRp === undefined ||
		pendapatanRp === undefined
	) {
		return null;
	}

	return {
		namaProyek,
		lokasi,
		sektor,
		jaminan,
		capexRp,
		tenorTahun,
		penghematanRp,
		pendapatanRp,
	};
}

readingRoutes.post(
	"/review/reading",
	mutationRateLimit("business", "project-reading"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const body = readReadingRequest(await c.req.json().catch(() => null));
		if (body === null) return apiError(c, "VALIDATION");

		const reading = await projectReading(c.env, body);
		return c.json({ reading });
	}),
);
