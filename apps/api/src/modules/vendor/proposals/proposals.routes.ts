import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { ProposalDraftBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidNumber, parseLimit } from "../../../lib/format";
import { requireJson } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
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
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const proposal = await getVendorProposal(db, c.get("user").id, id);
		if (!proposal) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Proposal not found" } },
				404,
			);
		}
		return c.json({ proposal });
	}),
);

proposalsRoutes.post(
	"/proposals",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit("vendor", "proposal")(c);
		if (rateError) return rateError;

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
			return c.json(
				{
					error: { code: "VALIDATION", message: "Invalid proposal input" },
				},
				400,
			);
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
				return c.json(
					{
						error: {
							code: "VALIDATION",
							message:
								"Complete your vendor profile before submitting a proposal",
						},
					},
					400,
				);
			case "unverified":
				return c.json(
					{
						error: {
							code: "FORBIDDEN",
							message: "Vendor profile has not been verified by an admin",
						},
					},
					403,
				);
			case "tender_not_found":
				return c.json(
					{ error: { code: "NOT_FOUND", message: "Tender not found" } },
					404,
				);
			case "tender_closed":
				return c.json(
					{
						error: { code: "TENDER_CLOSED", message: "Tender already closed" },
					},
					409,
				);
			case "deadline_passed":
				return c.json(
					{
						error: {
							code: "TENDER_DEADLINE",
							message: "Tender deadline has passed",
						},
					},
					409,
				);
			case "duplicate":
				return c.json(
					{
						error: {
							code: "DUPLICATE_PROPOSAL",
							message: "You have already submitted a proposal for this tender",
						},
					},
					409,
				);
			case "conflict":
				return c.json(
					{
						error: {
							code: "PROPOSAL_CONFLICT",
							message:
								"Proposal could not be submitted: the tender is closed or a proposal already exists",
						},
					},
					409,
				);
			case "load_failed":
				return c.json(
					{ error: { code: "INTERNAL", message: "Failed to load proposal" } },
					500,
				);
			default:
				return c.json({ proposal: result.proposal }, 201);
		}
	}),
);

proposalsRoutes.delete(
	"/proposals/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const result = await withdrawVendorProposal(db, c.get("user").id, id);
		if (result.status === "not_found") {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Proposal not found" } },
				404,
			);
		}
		if (result.status === "locked") {
			return c.json(
				{
					error: {
						code: "PROPOSAL_LOCKED",
						message:
							"Only proposals that have not yet been processed can be withdrawn",
					},
				},
				409,
			);
		}
		return c.json({ ok: true });
	}),
);
