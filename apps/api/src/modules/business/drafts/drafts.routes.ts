import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { BusinessDraftBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { validDraftId } from "../business.shared";
import { validationSummary } from "../business.validation";
import { loadDraft, saveDraft } from "./drafts.service";

const factory = createFactory<ApiEnv>();

export const draftsRoutes = new Hono<ApiEnv>();

/** Autosave fires per editing pause, so its bucket is sized for typing. */
const AUTOSAVE_PER_WINDOW = 120;

// ── autosave ──────────────────────────────────────────────
// Silent on success: this fires while the user types, and a toast per save
// would be noise. Failures still carry a message and a `fields` map.
draftsRoutes.put(
	"/drafts/:draftId",
	mutationRateLimit("business", "draft", AUTOSAVE_PER_WINDOW),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const draftId = c.req.param("draftId");
		if (!validDraftId(draftId)) {
			return apiError(c, "VALIDATION", "Invalid draft id.");
		}

		const body = (await c.req
			.json()
			.catch(() => null)) as BusinessDraftBody | null;
		if (body === null || typeof body !== "object") {
			return apiError(c, "VALIDATION");
		}

		const db = createDb(c.env.DB);
		const result = await saveDraft(db, c.get("user").id, draftId, body);

		if (result.outcome === "not_found") return apiNotFound(c, "Draft");
		if (result.outcome === "invalid") {
			return apiError(
				c,
				"VALIDATION",
				validationSummary(Object.keys(result.fields).length),
				{ fields: result.fields },
			);
		}
		return apiSuccess(c, { draft: result.draft });
	}),
);

// ── resume ────────────────────────────────────────────────
draftsRoutes.get(
	"/drafts/:draftId",
	...factory.createHandlers(async (c) => {
		const draftId = c.req.param("draftId");
		if (!validDraftId(draftId)) {
			return apiError(c, "VALIDATION", "Invalid draft id.");
		}

		const db = createDb(c.env.DB);
		const result = await loadDraft(db, c.get("user").id, draftId);
		if (result.outcome === "not_found") return apiNotFound(c, "Draft");

		return c.json({
			draft: result.draft,
			documents: result.documents,
		});
	}),
);
