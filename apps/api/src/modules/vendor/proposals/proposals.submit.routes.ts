import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidNumber } from "../../../lib/format";
import {
	declaredBodyTooLarge,
	MULTIPART_ENVELOPE_SLACK,
} from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { MAX_SPEC_LENGTH, MAX_WARRANTY_MONTHS } from "../vendor.shared";
import {
	isProposalPdf,
	MAX_PROPOSAL_DOCUMENT_BYTES,
	submitProposal,
} from "./proposals.service";

const factory = createFactory<ApiEnv>();

export const proposalSubmitRoutes = new Hono<ApiEnv>();

/** An optional multipart field as the number it states; a present but unreadable field comes back NaN and is rejected. */
function optionalNumber(value: unknown): number | undefined {
	if (value === undefined || value === null || value === "") return undefined;
	return Number(value);
}

// Multipart, because the bid and the document it is made on are one filing: the document is required.
proposalSubmitRoutes.post(
	"/proposals",
	mutationRateLimit("vendor", "proposal"),
	...factory.createHandlers(async (c) => {
		// The declared length is read before the body is: `parseBody` buffers the whole request.
		if (
			declaredBodyTooLarge(
				c,
				MAX_PROPOSAL_DOCUMENT_BYTES + MULTIPART_ENVELOPE_SLACK,
			)
		) {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"The proposal PDF must be 10 MB or smaller.",
			);
		}

		const parsed = await c.req.parseBody().catch(() => null);
		if (parsed === null) {
			return apiError(c, "VALIDATION", "Attach the proposal PDF.", {
				fields: { file: "Attach the proposal PDF." },
			});
		}
		const body = parsed;
		const file = body.file;
		if (!(file instanceof File)) {
			return apiError(c, "VALIDATION", "Attach the proposal PDF.", {
				fields: { file: "Attach the proposal PDF." },
			});
		}
		if (file.size > MAX_PROPOSAL_DOCUMENT_BYTES) {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"The proposal PDF must be 10 MB or smaller.",
			);
		}
		if (!isProposalPdf(file)) {
			return apiError(
				c,
				"UNSUPPORTED_MEDIA_TYPE",
				"The proposal document must be a PDF.",
			);
		}

		// Multipart fields arrive as strings, so each is read as the number it states.
		const tenderId = Number(body.tenderId);
		const amount = Number(body.amount);
		const technicalSpec = body.technicalSpec;
		const operationalCost = optionalNumber(body.operationalCost);
		const projectedRoi = optionalNumber(body.projectedRoi);
		const warrantyPeriod = optionalNumber(body.warrantyPeriod);

		if (
			!Number.isInteger(tenderId) ||
			tenderId <= 0 ||
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
		const result = await submitProposal(db, c.env, c.get("user").id, {
			tenderId,
			amount,
			technicalSpec:
				typeof technicalSpec === "string" ? technicalSpec : undefined,
			operationalCost,
			projectedRoi,
			warrantyPeriod,
			file,
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
