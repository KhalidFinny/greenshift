import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	BrokerAssignedProject,
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
	isoDate,
	MAX_TEXT,
} from "../../../lib/format";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { toRiskAssessment } from "../broker.shared";
import {
	getBrokerRepresentative,
	listAssignments,
	loadProjectContext,
} from "./projects.repository";
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

export const projectRoutes = new Hono<ApiEnv>();

// ── assigned projects (§11) ───────────────────────────────
projectRoutes.get(
	"/projects",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const brokerId = c.get("user").id;
		const limit = 100;

		const rows = await listAssignments(db, brokerId, limit);
		const representative = await getBrokerRepresentative(db, brokerId);
		const context = await loadProjectContext(
			db,
			rows.map((row) => row.project.id),
		);

		const list: BrokerAssignedProject[] = rows.map(
			({ assignment, project, company }) => {
				const entry = context.get(project.id);
				const validated =
					entry?.blueprintStatus === "validated" ||
					entry?.blueprintStatus === "published";
				const accepted =
					assignment.status !== "ASSIGNED" && assignment.status !== "DECLINED";
				return {
					id: project.id,
					title: project.title,
					companyName: company.name,
					companyEmail: company.email,
					vendorName: entry?.vendorName ?? null,
					industrySector: project.industrySector,
					location: project.location,
					projectValue: entry?.contractValue ?? project.budget ?? 0,
					lvvGrkStatus: validated ? "VERIFIED" : "PENDING",
					lvvGrkVerificationDate: isoDate(entry?.blueprintValidatedAt ?? null),
					blueprintStatus: entry?.blueprintStatus ?? null,
					workflowStatus: assignment.status,
					riskAssessment: entry?.risk ?? toRiskAssessment(undefined),
					bondInfo: {
						status: assignment.bondStatus,
						bondSerialNumber: assignment.bondSerialNumber,
						totalAmount: assignment.bondAmount ?? entry?.contractValue ?? 0,
						tenorMonths: assignment.tenorMonths,
						couponRatePercent: assignment.couponRatePercent,
						issuanceDate: isoDate(assignment.issuanceDate),
						maturityDate: isoDate(assignment.maturityDate),
						brokerRepresentative: representative,
					},
					financialProjections: entry?.financialProjections ?? {
						irrPercent: null,
						npvAmount: null,
						paybackYears: null,
					},
					assignedAt: assignment.assignedAt.toISOString(),
					isAccepted: accepted,
					declineReason: assignment.declineReason,
					informationRequest: assignment.informationRequest,
					outstandingRequestsCount: entry?.outstandingRequestsCount ?? 0,
					lastReportDate: entry?.lastReportDate ?? null,
					description: project.description,
					documents: entry?.documents ?? [],
					milestones: entry?.milestones ?? [],
				};
			},
		);

		return c.json({ projects: list });
	}),
);

// ── assignment decision (§21) ─────────────────────────────
projectRoutes.post(
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

// ── bond-preparation lifecycle (§20-§24) ──────────────────
projectRoutes.patch(
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

// ── external bond tracking (§25-§26) ──────────────────────
projectRoutes.patch(
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
