import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidNumber, parseLimit } from "../../../lib/format";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { MAX_SPEC_LENGTH, MAX_WARRANTY_MONTHS } from "../vendor.shared";
import {
	attachProposalDocument,
	getVendorProposal,
	isProposalPdf,
	listVendorProposals,
	MAX_PROPOSAL_DOCUMENT_BYTES,
	readVendorProposalDocument,
	submitProposal,
	withdrawVendorProposal,
} from "./proposals.service";

const factory = createFactory<ApiEnv>();

export const proposalsRoutes = new Hono<ApiEnv>();

/**
 * What the multipart envelope around one file costs: the boundaries and the part
 * headers. The declared length covers the envelope too, so the gate has to allow
 * for it or a file exactly at the limit would be refused.
 */
const MULTIPART_ENVELOPE_SLACK = 8 * 1024;

/**
 * An optional multipart field as the number it states, or undefined when the
 * vendor left it out. A field that is present but unreadable comes back as NaN,
 * which the `invalidNumber` rules then reject.
 */
function optionalNumber(value: unknown): number | undefined {
	if (value === undefined || value === null || value === "") return undefined;
	return Number(value);
}

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

// Multipart, because the bid and the document it is made on are one filing:
// the fields are the offer, the file is the case for it, and the document is
// required, so no bid exists without one.
proposalsRoutes.post(
	"/proposals",
	mutationRateLimit("vendor", "proposal"),
	...factory.createHandlers(async (c) => {
		// The declared length is read before the body is: `parseBody` buffers the
		// whole request, so a file over the limit has to be turned away before it
		// is materialized in the isolate.
		const declared = Number(c.req.header("content-length") ?? "0");
		if (
			Number.isFinite(declared) &&
			declared > MAX_PROPOSAL_DOCUMENT_BYTES + MULTIPART_ENVELOPE_SLACK
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

		// Multipart fields arrive as strings, so each one is read as the number
		// the offer states rather than trusted as typed.
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

proposalsRoutes.delete(
	"/proposals/:id",
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const result = await withdrawVendorProposal(
			db,
			c.env,
			c.get("user").id,
			id,
		);
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

// ── file the proposal document ────────────────────────────
// Multipart, like every upload: `requireJsonBody` is not on this router, so the
// JSON mutations guard themselves and this route takes the file as it is.
proposalsRoutes.post(
	"/proposals/:id/document",
	mutationRateLimit("vendor", "proposal"),
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		// The declared length is read before the body is: `parseBody` buffers the
		// whole request, so a file over the limit has to be turned away before it
		// is materialized in the isolate.
		const declared = Number(c.req.header("content-length") ?? "0");
		if (
			Number.isFinite(declared) &&
			declared > MAX_PROPOSAL_DOCUMENT_BYTES + MULTIPART_ENVELOPE_SLACK
		) {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"The PDF must be 10 MB or smaller.",
			);
		}

		const body = await c.req.parseBody().catch(() => null);
		const file = body?.file;
		if (!(file instanceof File)) {
			return apiError(c, "VALIDATION", "Attach the PDF in the 'file' field.");
		}

		const db = createDb(c.env.DB);
		const result = await attachProposalDocument(
			db,
			c.env,
			c.get("user").id,
			id,
			file,
		);

		if (result.status === "not_found") return apiNotFound(c, "Proposal");
		if (result.status === "too_large") {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"The PDF must be 10 MB or smaller.",
			);
		}
		if (result.status === "unsupported") {
			return apiError(
				c,
				"UNSUPPORTED_MEDIA_TYPE",
				"The proposal document must be a PDF.",
			);
		}

		return apiSuccess(
			c,
			{ documentName: result.documentName },
			"Proposal document filed",
		);
	}),
);

// ── read the filed document ───────────────────────────────
proposalsRoutes.get(
	"/proposals/:id/document",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const result = await readVendorProposalDocument(
			db,
			c.env,
			c.get("user").id,
			id,
		);
		if (result.outcome === "not_found") return apiNotFound(c, "Document");

		return new Response(result.body, {
			headers: {
				"Content-Type": result.contentType,
				"Content-Disposition": `inline; filename="${result.fileName.replace(/["\\]/g, "")}"`,
				"Cache-Control": "private, no-store",
			},
		});
	}),
);
