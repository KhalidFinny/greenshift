import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { parseLimit } from "../../../lib/format";
import { requireJsonBody } from "../../../lib/http";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { proposalDocumentRoutes } from "./proposals.document.routes";
import {
	getVendorProposal,
	listVendorProposals,
	withdrawVendorProposal,
} from "./proposals.service";
import { proposalSubmitRoutes } from "./proposals.submit.routes";

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

proposalsRoutes.route("/", proposalSubmitRoutes);
proposalsRoutes.route("/", proposalDocumentRoutes);
