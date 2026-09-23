import { desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	brokerAssignments,
	brokerProfiles,
	projects,
	users,
} from "../../../db/schema";

export {
	loadProjectContext,
	type ProjectContext,
} from "./project-context.repository";

/** Assigned projects of one broker, newest assignment first. */
export function listAssignments(
	db: GreenShiftDb,
	brokerId: number,
	limit: number,
) {
	return db
		.select({
			assignment: brokerAssignments,
			project: projects,
			company: users,
		})
		.from(brokerAssignments)
		.innerJoin(projects, eq(brokerAssignments.projectId, projects.id))
		.innerJoin(users, eq(brokerAssignments.companyId, users.id))
		.where(eq(brokerAssignments.brokerId, brokerId))
		.orderBy(desc(brokerAssignments.assignedAt))
		.limit(limit);
}

/** Representative printed on the bond terms of this broker's assignments. */
export async function getBrokerRepresentative(
	db: GreenShiftDb,
	brokerId: number,
): Promise<string | null> {
	const [profile] = await db
		.select({ representative: brokerProfiles.representative })
		.from(brokerProfiles)
		.where(eq(brokerProfiles.userId, brokerId))
		.limit(1);
	return profile?.representative ?? null;
}
