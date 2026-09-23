import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { createDb, type GreenShiftDb } from "../../db";
import {
	brokerAssignments,
	brokerProfiles,
	notifications,
	projects,
	users,
} from "../../db/schema";
import type { ApiEnv } from "../../env";
import { ApiFailure } from "../../lib/response";

// A broker that is not verified cannot receive or process projects (§6, rule 1).
export const requireVerifiedBroker = createMiddleware<ApiEnv>(
	async (c, next) => {
		const db = createDb(c.env.DB);
		const [profile] = await db
			.select({ id: brokerProfiles.id, verifiedAt: brokerProfiles.verifiedAt })
			.from(brokerProfiles)
			.where(eq(brokerProfiles.userId, c.get("user").id))
			.limit(1);

		if (!profile?.verifiedAt) {
			throw new ApiFailure(
				"VERIFICATION_REQUIRED",
				"Broker verification must be completed before processing projects",
			);
		}
		await next();
	},
);

/** Notifications the broker is expected to receive (§38). */
export async function notify(
	db: GreenShiftDb,
	userId: number,
	entry: { type: string; title: string; body: string; link: string },
): Promise<void> {
	await db.insert(notifications).values({
		userId,
		type: entry.type,
		title: entry.title,
		body: entry.body,
		link: entry.link,
	});
}

export interface AssignmentRow {
	assignment: typeof brokerAssignments.$inferSelect;
	project: typeof projects.$inferSelect;
	company: typeof users.$inferSelect;
}

/** Owner-scoped assignment: a broker only ever sees its own rows. */
export async function getAssignment(
	db: GreenShiftDb,
	brokerId: number,
	projectId: number,
): Promise<AssignmentRow | null> {
	const [row] = await db
		.select({
			assignment: brokerAssignments,
			project: projects,
			company: users,
		})
		.from(brokerAssignments)
		.innerJoin(projects, eq(brokerAssignments.projectId, projects.id))
		.innerJoin(users, eq(brokerAssignments.companyId, users.id))
		.where(
			and(
				eq(brokerAssignments.brokerId, brokerId),
				eq(brokerAssignments.projectId, projectId),
			),
		)
		.limit(1);
	return row ?? null;
}

export {
	riskLevel,
	toMilestone,
	toNotification,
	toProjectDocument,
	toRiskAssessment,
} from "./broker.projection";
export { composeReport, type ReportSource } from "./broker.report";
