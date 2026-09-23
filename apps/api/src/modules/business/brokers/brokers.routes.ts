// The company's broker choice: the pool, the project's current assignment, and the write.

import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { BusinessAssignBrokerBody } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import {
	assignBroker,
	listBrokerOptions,
	readProjectBroker,
} from "./brokers.service";

const factory = createFactory<ApiEnv>();

export const brokersRoutes = new Hono<ApiEnv>();

function idParam(c: { req: { param: (key: string) => string | undefined } }) {
	const raw = c.req.param("id");
	return raw && /^\d+$/.test(raw) ? Number(raw) : null;
}

brokersRoutes.get(
	"/brokers",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		return c.json({ brokers: await listBrokerOptions(db) });
	}),
);

brokersRoutes.get(
	"/projects/:id/broker",
	...factory.createHandlers(async (c) => {
		const id = idParam(c);
		if (id === null) return apiError(c, "INVALID_ID");

		const db = createDb(c.env.DB);
		const result = await readProjectBroker(db, c.get("user").id, id);
		if (result.outcome === "not_found") return apiNotFound(c, "Project");

		return c.json({ awarded: result.awarded, assignment: result.assignment });
	}),
);

brokersRoutes.post(
	"/projects/:id/broker",
	mutationRateLimit("business", "broker-assignment"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const id = idParam(c);
		if (id === null) return apiError(c, "INVALID_ID");

		const body = (await c.req
			.json()
			.catch(() => null)) as BusinessAssignBrokerBody | null;
		const brokerId = Number(body?.brokerId);
		if (!Number.isInteger(brokerId) || brokerId <= 0) {
			return apiError(c, "VALIDATION", "Choose the broker to assign.", {
				fields: { brokerId: "Choose the broker to assign." },
			});
		}

		const db = createDb(c.env.DB);
		const user = c.get("user");
		const result = await assignBroker(db, {
			companyId: user.id,
			companyName: user.companyName ?? user.name,
			projectId: id,
			brokerId,
		});

		if (result.outcome === "not_found") return apiNotFound(c, "Project");
		if (result.outcome === "not_awarded") {
			return apiError(
				c,
				"INVALID_STATE",
				"This project's tender must be awarded before a broker can be chosen.",
			);
		}
		if (result.outcome === "already_assigned") {
			return apiError(
				c,
				"INVALID_STATE",
				`${result.firmName} is already assigned to this project.`,
			);
		}
		if (result.outcome === "unknown_broker") {
			return apiError(c, "VALIDATION", "Choose one of the verified brokers.", {
				fields: { brokerId: "Choose one of the verified brokers." },
			});
		}

		return apiSuccess(
			c,
			{ assignment: result.assignment },
			`${result.assignment.firmName} is assigned to this project.`,
			201,
		);
	}),
);
