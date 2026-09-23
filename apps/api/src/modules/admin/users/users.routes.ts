import { Hono } from "hono";
import type { AdminUser, VerifyUserBody } from "../../../contracts";
import { createDb } from "../../../db";
import { userRoles } from "../../../db/schema";
import type { ApiEnv } from "../../../env";
import { requireRecentStepUp } from "../../../lib/authz";
import { iso, parseLimit } from "../../../lib/format";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import {
	isCompanyDocumentSlot,
	readCompanyDocumentForAdmin,
} from "../../business/verification/verification.service";
import { factory } from "../admin.shared";
import { listUsers } from "./users.repository";
import { readUserVerification, verifyUser } from "./users.service";

export const userRoutes = new Hono<ApiEnv>();

userRoutes.get(
	"/users",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const role = c.req.query("role");
		if (role && !(userRoles as readonly string[]).includes(role)) {
			return apiError(c, "VALIDATION", "Invalid role");
		}
		const limit = parseLimit(c.req.query("limit"));

		const rows = await listUsers(db, role, limit);

		const list: AdminUser[] = rows.map(
			({ user, vendorId, vendorServiceCategory }) => ({
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
				companyName: user.companyName,
				industrySector: user.industrySector,
				serviceCategory: vendorServiceCategory,
				address: user.address,
				verifiedAt: iso(user.verifiedAt),
				verificationState:
					user.role === "business" ? user.verificationState : null,
				vendorProfile: vendorId !== null,
				createdAt: iso(user.createdAt),
			}),
		);
		return c.json({ users: list });
	}),
);

userRoutes.patch(
	"/users/:id/verify",
	requireRecentStepUp,
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<VerifyUserBody> | null;
		if (
			!Number.isInteger(id) ||
			id <= 0 ||
			typeof body?.verified !== "boolean"
		) {
			return apiError(c, "VALIDATION");
		}

		const result = await verifyUser(createDb(c.env.DB), {
			id,
			verified: body.verified,
			actorId: c.get("user").id,
			rejectionReason: body.rejectionReason ?? null,
		});
		if (!result.ok) {
			if (result.reason === "not_found") {
				return apiNotFound(c, "User");
			}
			if (result.reason === "pack_not_filed") {
				return apiError(
					c,
					"INVALID_STATE",
					"This company has not filed its verification pack yet, so there is nothing to verify.",
				);
			}
			return apiError(c, "FORBIDDEN", "Admin account cannot be unverified");
		}
		return apiSuccess(c, { ok: true }, "User verification updated");
	}),
);

// The pack a verification verdict is about.
userRoutes.get(
	"/users/:id/verification",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const db = createDb(c.env.DB);
		const verification = await readUserVerification(db, id);
		if (!verification) return apiNotFound(c, "User");
		return c.json({ verification });
	}),
);

userRoutes.get(
	"/users/:id/verification/documents/:slot",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		const slot = c.req.param("slot");
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}
		if (!isCompanyDocumentSlot(slot)) {
			return apiError(c, "VALIDATION", "Unknown document slot.");
		}

		const db = createDb(c.env.DB);
		const result = await readCompanyDocumentForAdmin(db, c.env, id, slot);
		if (result.outcome === "not_found") return apiNotFound(c, "Certificate");

		return new Response(result.body, {
			headers: {
				"Content-Type": result.contentType,
				"Content-Disposition": `inline; filename="${result.fileName.replace(/["\\]/g, "")}"`,
				"Cache-Control": "private, no-store",
			},
		});
	}),
);
