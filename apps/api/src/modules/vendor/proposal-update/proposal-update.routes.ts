import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { ProposalUpdateBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidNumber } from "../../../lib/format";
import { requireJson } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { MAX_SPEC_LENGTH, MAX_WARRANTY_MONTHS } from "../vendor.shared";
import { MAX_REVISIONS, updateVendorProposal } from "./proposal-update.service";

const factory = createFactory<ApiEnv>();

export const proposalUpdateRoutes = new Hono<ApiEnv>();

const MAX_NOTE_LENGTH = 2000;

proposalUpdateRoutes.patch(
	"/proposals/:id",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit("vendor", "proposal")(c);
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
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid input" } },
				400,
			);
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
				return c.json(
					{ error: { code: "NOT_FOUND", message: "Proposal not found" } },
					404,
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
			case "locked":
				return c.json(
					{
						error: {
							code: "PROPOSAL_LOCKED",
							message:
								"Proposal has already been processed and cannot be edited",
						},
					},
					409,
				);
			case "revision_limit":
				return c.json(
					{
						error: {
							code: "REVISION_LIMIT",
							message: `Revision limit (${MAX_REVISIONS}) has been reached`,
						},
					},
					409,
				);
			case "revision_conflict":
				return c.json(
					{
						error: {
							code: "REVISION_LIMIT",
							message: `Revision limit (${MAX_REVISIONS}) reached or the proposal has already been responded to`,
						},
					},
					409,
				);
			default:
				return c.json({ proposal: result.detail });
		}
	}),
);
