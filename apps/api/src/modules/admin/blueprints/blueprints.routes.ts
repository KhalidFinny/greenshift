import { Hono } from "hono";
import type { AdminBlueprint, BlueprintUpdateBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireRecentStepUp } from "../../../lib/authz";
import { iso, parseLimit } from "../../../lib/format";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { factory } from "../admin.shared";
import { listBlueprints } from "./blueprints.repository";
import {
	type BlueprintStatus,
	blueprintStatuses,
	updateBlueprint,
} from "./blueprints.service";

export const blueprintRoutes = new Hono<ApiEnv>();

blueprintRoutes.get(
	"/blueprints",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const status = c.req.query("status");
		if (status && !(blueprintStatuses as readonly string[]).includes(status)) {
			return apiError(c, "INVALID_STATUS");
		}
		const limit = parseLimit(c.req.query("limit"));

		const rows = await listBlueprints(db, status, limit);

		const list: AdminBlueprint[] = rows.map(({ blueprint, projectTitle }) => ({
			id: blueprint.id,
			projectId: blueprint.projectId,
			projectTitle,
			status: blueprint.status,
			auditNote: blueprint.auditNote,
			validatedAt: iso(blueprint.validatedAt),
			publishedAt: iso(blueprint.publishedAt),
		}));
		return c.json({ blueprints: list });
	}),
);

blueprintRoutes.patch(
	"/blueprints/:id",
	requireRecentStepUp,
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<BlueprintUpdateBody> | null;
		const status = body?.status;
		if (
			!Number.isInteger(id) ||
			id <= 0 ||
			typeof status !== "string" ||
			!(blueprintStatuses as readonly string[]).includes(status)
		) {
			return apiError(c, "VALIDATION");
		}

		const result = await updateBlueprint(createDb(c.env.DB), {
			id,
			status: status as BlueprintStatus,
			auditNote: body?.auditNote,
			actorId: c.get("user").id,
		});
		if (!result.ok) {
			if (result.reason === "not_found") {
				return apiNotFound(c, "Blueprint");
			}
			if (result.reason === "invalid_transition") {
				return apiError(c, "INVALID_TRANSITION");
			}
			return apiError(c, "BLUEPRINT_INCOMPLETE");
		}
		return apiSuccess(c, { ok: true }, "Blueprint status updated");
	}),
);
