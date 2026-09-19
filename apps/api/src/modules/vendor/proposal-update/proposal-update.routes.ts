import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { ProposalUpdateBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidNumber } from "../../../lib/format";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { MAX_SPEC_LENGTH, MAX_WARRANTY_MONTHS } from "../vendor.shared";
import { MAX_REVISIONS, updateVendorProposal } from "./proposal-update.service";

const factory = createFactory<ApiEnv>();

export const proposalUpdateRoutes = new Hono<ApiEnv>();

const MAX_NOTE_LENGTH = 2000;

proposalUpdateRoutes.patch(
	"/proposals/:id",
	mutationRateLimit("vendor", "proposal"),
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<ProposalUpdateBody> | null;
		const amount = body?.amount;
		const technicalSpec = body?.technicalSpec;
		const operationalCost = body?.operationalCost;
		const projectedRoi = body?.projectedRoi;
		const warrantyPeriod = body?.warrantyPeriod;
		const note = body?.note;

		const hasFieldUpdate =
			amount !== undefined ||
			technicalSpec !== undefined ||
			operationalCost !== undefined ||
			projectedRoi !== undefined ||
			warrantyPeriod !== undefined;

		if (
			!hasFieldUpdate ||
			(amount !== undefined && (invalidNumber(amount) || amount <= 0)) ||
			(technicalSpec !== undefined &&
				(typeof technicalSpec !== "string" ||
					technicalSpec.length > MAX_SPEC_LENGTH)) ||
			invalidNumber(operationalCost, { min: 0 }) ||
			invalidNumber(projectedRoi, { min: 0 }) ||
			invalidNumber(warrantyPeriod, {
				integer: true,
				min: 1,
				max: MAX_WARRANTY_MONTHS,
			}) ||
			(note !== undefined &&
				(typeof note !== "string" || note.length > MAX_NOTE_LENGTH))
		) {
			return apiError(c, "VALIDATION");
		}

		const db = createDb(c.env.DB);
		const result = await updateVendorProposal(db, c.get("user").id, id, {
			amount,
			technicalSpec,
			operationalCost,
			projectedRoi,
			warrantyPeriod,
			note,
		});

		switch (result.status) {
			case "not_found":
				return apiNotFound(c, "Proposal");
			case "unverified":
				return apiError(
					c,
					"VERIFICATION_REQUIRED",
					"Vendor profile has not been verified by an admin",
				);
			case "locked":
				return apiError(c, "PROPOSAL_LOCKED");
			case "revision_limit":
				return apiError(
					c,
					"REVISION_LIMIT",
					`Revision limit (${MAX_REVISIONS}) has been reached`,
				);
			case "revision_conflict":
				return apiError(
					c,
					"REVISION_LIMIT",
					`Revision limit (${MAX_REVISIONS}) reached or the proposal has already been responded to`,
				);
			default:
				return apiSuccess(c, { proposal: result.detail }, "Proposal updated");
		}
	}),
);
