import { Hono } from "hono";
import {
	type AdminVendor,
	apiRoutes,
	type VerifyVendorBody,
} from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireRecentStepUp } from "../../../lib/authz";
import { iso, parseLimit } from "../../../lib/format";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { readVendorCertificateForAdmin } from "../../vendor/profile/certificate.service";
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
			nib: vendor.nib,
			npwp: vendor.npwp,
			tdp: vendor.tdp,
			certificateName: vendor.certificateName,
			certificateUrl: vendor.certificateKey
				? apiRoutes.adminVendorCertificate.path.replace(
						":id",
						String(vendor.id),
					)
				: null,
			certificateScan: vendor.certificateScan ?? null,
			rejectionReason: vendor.verificationRejectionReason,
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
			rejectionReason: body.rejectionReason ?? null,
		});
		if (!result.ok) {
			if (result.reason === "pack_not_filed") {
				return apiError(
					c,
					"INVALID_STATE",
					"This vendor has not filed its verification pack yet, so there is nothing to verify.",
				);
			}
			return apiNotFound(c, "Vendor");
		}
		return apiSuccess(c, { ok: true }, "Vendor verification updated");
	}),
);

vendorRoutes.get(
	"/vendors/:id/certificate",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return apiError(c, "INVALID_ID");
		}

		const result = await readVendorCertificateForAdmin(
			createDb(c.env.DB),
			c.env,
			id,
		);
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
