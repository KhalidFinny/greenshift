import { Hono } from "hono";
import type { AdminUser, VerifyUserBody } from "../../../contracts";
import { createDb } from "../../../db";
import { userRoles } from "../../../db/schema";
import type { ApiEnv } from "../../../env";
import { requireRecentStepUp } from "../../../lib/authz";
import { iso, parseLimit } from "../../../lib/format";
import { requireJson } from "../../../lib/http";
import { factory } from "../admin.shared";
import { listUsers } from "./users.repository";
import { verifyUser } from "./users.service";

export const userRoutes = new Hono<ApiEnv>();

userRoutes.get(
	"/users",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const role = c.req.query("role");
		if (role && !(userRoles as readonly string[]).includes(role)) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid role" } },
				400,
			);
		}
		const limit = parseLimit(c.req.query("limit"));

		const rows = await listUsers(db, role, limit);

		const list: AdminUser[] = rows.map(({ user, vendorId }) => ({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			companyName: user.companyName,
			verifiedAt: iso(user.verifiedAt),
			vendorProfile: vendorId !== null,
			createdAt: iso(user.createdAt),
		}));
		return c.json({ users: list });
	}),
);

userRoutes.patch(
	"/users/:id/verify",
	requireRecentStepUp,
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<VerifyUserBody> | null;
		if (
			!Number.isInteger(id) ||
			id <= 0 ||
			typeof body?.verified !== "boolean"
		) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid input" } },
				400,
			);
		}

		const result = await verifyUser(createDb(c.env.DB), {
			id,
			verified: body.verified,
			actorId: c.get("user").id,
		});
		if (!result.ok) {
			if (result.reason === "not_found") {
				return c.json(
					{ error: { code: "NOT_FOUND", message: "User not found" } },
					404,
				);
			}
			return c.json(
				{
					error: {
						code: "FORBIDDEN",
						message: "Admin account cannot be unverified",
					},
				},
				403,
			);
		}
		return c.json({ ok: true });
	}),
);
