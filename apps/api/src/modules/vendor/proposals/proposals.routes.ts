import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { ProposalDraftBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidNumber, parseLimit } from "../../../lib/format";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { MAX_SPEC_LENGTH, MAX_WARRANTY_MONTHS } from "../vendor.shared";
import {
	getVendorProposal,
	listVendorProposals,
	submitProposal,
	withdrawVendorProposal,
} from "./proposals.service";

const factory = createFactory<ApiEnv>();

export const proposalsRoutes = new Hono<ApiEnv>();

proposalsRoutes.get(
	"/proposals",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const proposals = await listVendorProposals(db, c.get("user").id, limit);
		return c.json({ proposals });
	}),
);

proposalsRoutes.get(
	"/proposals/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const proposal = await getVendorProposal(db, c.get("user").id, id);
		if (!proposal) {
			return apiNotFound(c, "Proposal");
		}
		return c.json({ proposal });
	}),
);

proposalsRoutes.post(
	"/proposals",
	mutationRateLimit("vendor", "proposal"),
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<ProposalDraftBody> | null;
		const tenderId = body?.tenderId;
		const amount = body?.amount;
		const technicalSpec = body?.technicalSpec;
		const operationalCost = body?.operationalCost;
		const projectedRoi = body?.projectedRoi;
		const warrantyPeriod = body?.warrantyPeriod;

		if (
			typeof tenderId !== "number" ||
			!Number.isInteger(tenderId) ||
			tenderId <= 0 ||
			typeof amount !== "number" ||
			!Number.isFinite(amount) ||
			amount <= 0 ||
			(technicalSpec !== undefined &&
				(typeof technicalSpec !== "string" ||
					technicalSpec.length > MAX_SPEC_LENGTH)) ||
			invalidNumber(operationalCost, { min: 0 }) ||
			invalidNumber(projectedRoi, { min: 0 }) ||
			invalidNumber(warrantyPeriod, {
				integer: true,
				min: 1,
				max: MAX_WARRANTY_MONTHS,
			})
		) {
			return apiError(c, "VALIDATION", "Invalid proposal input");
		}

		const db = createDb(c.env.DB);
		const result = await submitProposal(db, c.get("user").id, {
			tenderId,
			amount,
			technicalSpec,
			operationalCost,
			projectedRoi,
			warrantyPeriod,
		});

		switch (result.status) {
			case "no_profile":
				return apiError(
					c,
					"VALIDATION",
					"Complete your vendor profile before submitting a proposal",
				);
			case "unverified":
				return apiError(
					c,
					"VERIFICATION_REQUIRED",
					"Vendor profile has not been verified by an admin",
				);
			case "tender_not_found":
				return apiNotFound(c, "Tender");
			case "tender_closed":
				return apiError(c, "TENDER_CLOSED");
			case "not_invited":
				return apiError(
					c,
					"FORBIDDEN",
					"This tender was not opened to your company.",
				);
			case "deadline_passed":
				return apiError(c, "TENDER_DEADLINE");
			case "duplicate":
				return apiError(c, "DUPLICATE_PROPOSAL");
			case "conflict":
				return apiError(c, "PROPOSAL_CONFLICT");
			case "load_failed":
				return apiError(c, "INTERNAL", "Failed to load proposal");
			default:
				return apiSuccess(
					c,
					{ proposal: result.proposal },
					"Proposal submitted successfully",
					201,
				);
		}
	}),
);

proposalsRoutes.delete(
	"/proposals/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const result = await withdrawVendorProposal(db, c.get("user").id, id);
		if (result.status === "not_found") {
			return apiNotFound(c, "Proposal");
		}
		if (result.status === "locked") {
			return apiError(
				c,
				"PROPOSAL_LOCKED",
				"Only proposals that have not yet been processed can be withdrawn",
			);
		}
		return apiSuccess(c, { ok: true }, "Proposal withdrawn");
	}),
);
