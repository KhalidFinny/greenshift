import { Hono } from "hono";
import type { AdminBroker, VerifyBrokerBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireRecentStepUp } from "../../../lib/authz";
import { iso, parseLimit } from "../../../lib/format";
import { requireJson } from "../../../lib/http";
import { factory } from "../admin.shared";
import { listBrokers } from "./brokers.repository";
import { verifyBroker } from "./brokers.service";

export const brokerRoutes = new Hono<ApiEnv>();

// Self-service registration (§6): the broker files its licence data, the
// platform verifies it here. Only verified brokers can process projects.
brokerRoutes.get(
	"/brokers",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const rows = await listBrokers(db, limit);

		const list: AdminBroker[] = rows.map(({ broker, user }) => ({
			id: broker.id,
			userId: broker.userId,
			companyName: broker.companyName,
			representative: broker.representative,
			email: user.email,
			nib: broker.nib,
			financialLicenseNumber: broker.financialLicenseNumber,
			licenseAuthority: broker.licenseAuthority,
			submittedAt: iso(broker.submittedAt),
			verifiedAt: iso(broker.verifiedAt),
			rejectionReason: broker.rejectionReason,
		}));
		return c.json({ brokers: list });
	}),
);

brokerRoutes.patch(
	"/brokers/:id/verify",
	requireRecentStepUp,
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<VerifyBrokerBody> | null;
		if (
			!Number.isInteger(id) ||
			id <= 0 ||
			typeof body?.verified !== "boolean" ||
			(body?.rejectionReason !== undefined &&
				(typeof body.rejectionReason !== "string" ||
					body.rejectionReason.length > 500))
		) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid input" } },
				400,
			);
		}
		if (!body.verified && !body.rejectionReason?.trim()) {
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message: "A rejection reason is required",
					},
				},
				400,
			);
		}

		const result = await verifyBroker(createDb(c.env.DB), {
			id,
			verified: body.verified,
			rejectionReason: body.rejectionReason,
			actorId: c.get("user").id,
		});
		if (!result.ok) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Broker not found" } },
				404,
			);
		}
		return c.json({ ok: true });
	}),
);
