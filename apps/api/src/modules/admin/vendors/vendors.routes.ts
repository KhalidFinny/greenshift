import { Hono } from "hono";
import type { AdminVendor, VerifyVendorBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireRecentStepUp } from "../../../lib/authz";
import { iso, parseLimit } from "../../../lib/format";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { factory } from "../admin.shared";
import { listVendors } from "./vendors.repository";
import { verifyVendor } from "./vendors.service";

export const vendorRoutes = new Hono<ApiEnv>();

vendorRoutes.get(
	"/vendors",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const rows = await listVendors(db, limit);

		const list: AdminVendor[] = rows.map(({ vendor, user }) => ({
			id: vendor.id,
			userId: vendor.userId,
			email: user.email,
			userName: user.name,
			companyName: vendor.companyName,
			description: vendor.description,
			certifications: (vendor.certifications as string[]) ?? [],
			portfolio: (vendor.portfolio as string[]) ?? [],
			rating: vendor.rating ?? 0,
			totalProjects: vendor.totalProjects ?? 0,
			verifiedAt: iso(vendor.verifiedAt),
			createdAt: iso(vendor.createdAt),
		}));
		return c.json({ vendors: list });
	}),
);

vendorRoutes.patch(
	"/vendors/:id/verify",
	requireRecentStepUp,
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<VerifyVendorBody> | null;
		if (
			!Number.isInteger(id) ||
			id <= 0 ||
			typeof body?.verified !== "boolean"
		) {
			return apiError(c, "VALIDATION");
		}

		const result = await verifyVendor(createDb(c.env.DB), {
			id,
			verified: body.verified,
			actorId: c.get("user").id,
		});
		if (!result.ok) {
			return apiNotFound(c, "Vendor");
		}
		return apiSuccess(c, { ok: true }, "Vendor verification updated");
	}),
);
