import { Hono } from "hono";
import type { AdminVendor, VerifyVendorBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireRecentStepUp } from "../../../lib/authz";
import { iso, parseLimit } from "../../../lib/format";
import { requireJson } from "../../../lib/http";
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
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<VerifyVendorBody> | null;
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

		const result = await verifyVendor(createDb(c.env.DB), {
			id,
			verified: body.verified,
			actorId: c.get("user").id,
		});
		if (!result.ok) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Vendor not found" } },
				404,
			);
		}
		return c.json({ ok: true });
	}),
);
