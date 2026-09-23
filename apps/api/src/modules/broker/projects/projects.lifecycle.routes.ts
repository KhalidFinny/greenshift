import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	BrokerAssignmentResponseBody,
	BrokerBondUpdateBody,
	BrokerProjectStatusBody,
} from "../../../contracts";
import { createDb } from "../../../db";
import type { BondIssuanceStatus } from "../../../db/schema";
import type { ApiEnv } from "../../../env";
import {
	invalidOptionalNumber,
	invalidOptionalText,
	MAX_TEXT,
} from "../../../lib/format";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import {
	BOND_STATUSES,
	changeProjectStatus,
	respondToAssignment,
	updateBondStatus,
} from "./projects.service";

const factory = createFactory<ApiEnv>();
const assignmentLimit = mutationRateLimit("broker", "assignment");
const statusLimit = mutationRateLimit("broker", "status");
const bondLimit = mutationRateLimit("broker", "bond");

export const projectLifecycleRoutes = new Hono<ApiEnv>();

projectLifecycleRoutes.post(
	"/projects/:id/response",
	assignmentLimit,
	...factory.createHandlers(async (c) => {
		const projectId = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<BrokerAssignmentResponseBody> | null;
		const action = body?.action;
		if (
			!Number.isInteger(projectId) ||
			projectId <= 0 ||
			(action !== "ACCEPT" &&
				action !== "DECLINE" &&
				action !== "REQUEST_INFORMATION") ||
			invalidOptionalText(body?.reason, MAX_TEXT) ||
			invalidOptionalText(body?.message, MAX_TEXT)
		) {
			return apiError(c, "VALIDATION");
		}

		const db = createDb(c.env.DB);
		const result = await respondToAssignment(db, {
			brokerId: c.get("user").id,
			userName: c.get("user").name,
			projectId,
			body: { ...body, action },
		});
		if (result.outcome === "not_found") {
			return apiNotFound(c, "Assignment");
		}
		if (result.outcome === "conflict") {
			return apiError(c, "CONFLICT", result.message);
		}
		if (result.outcome === "invalid") {
			return apiError(c, "VALIDATION", result.message);
		}
		return apiSuccess(c, { ok: true }, "Changes saved successfully");
	}),
);

projectLifecycleRoutes.patch(
	"/projects/:id/status",
	statusLimit,
	...factory.createHandlers(async (c) => {
		const projectId = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<BrokerProjectStatusBody> | null;
		if (
			!Number.isInteger(projectId) ||
			projectId <= 0 ||
			typeof body?.status !== "string"
		) {
			return apiError(c, "VALIDATION");
		}

		const db = createDb(c.env.DB);
		const result = await changeProjectStatus(db, {
			brokerId: c.get("user").id,
			projectId,
			status: body.status,
		});
		if (result.outcome === "not_found") {
			return apiNotFound(c, "Assignment");
		}
		if (result.outcome === "conflict") {
			return apiError(c, "CONFLICT", result.message);
		}
		return apiSuccess(c, { ok: true }, "Changes saved successfully");
	}),
);

projectLifecycleRoutes.patch(
	"/projects/:id/bond",
	bondLimit,
	...factory.createHandlers(async (c) => {
		const projectId = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<BrokerBondUpdateBody> | null;
		const status = body?.status as BondIssuanceStatus | undefined;
		const numbers = [body?.amount, body?.tenorMonths, body?.couponRatePercent];
		const invalidNumberField = numbers.some((value) =>
			invalidOptionalNumber(value, { min: 0 }),
		);
		const dates = [body?.issuanceDate, body?.maturityDate];
		const invalidDate = dates.some(
			(value) =>
				value !== undefined &&
				(typeof value !== "string" || Number.isNaN(Date.parse(value))),
		);

		if (
			!Number.isInteger(projectId) ||
			projectId <= 0 ||
			typeof status !== "string" ||
			!BOND_STATUSES.includes(status) ||
			invalidOptionalText(body?.serialNumber, 120) ||
			invalidNumberField ||
			invalidDate
		) {
			return apiError(c, "VALIDATION");
		}

		const db = createDb(c.env.DB);
		const result = await updateBondStatus(db, {
			brokerId: c.get("user").id,
			projectId,
			body: { ...body, status },
		});
		if (result.outcome === "not_found") {
			return apiNotFound(c, "Assignment");
		}
		return apiSuccess(c, { ok: true }, "Changes saved successfully");
	}),
);
