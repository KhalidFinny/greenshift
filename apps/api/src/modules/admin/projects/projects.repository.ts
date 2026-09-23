import { desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	auditLogs,
	blueprints,
	organizationName,
	type projectStatuses,
	projects,
	users,
} from "../../../db/schema";

/** Projects with their company name and blueprint status, newest first. */
export async function listProjects(
	db: GreenShiftDb,
	status: string | undefined,
	limit: number,
) {
	const query = db
		.select({
			project: projects,
			companyName: organizationName,
			blueprintStatus: blueprints.status,
		})
		.from(projects)
		.innerJoin(users, eq(projects.companyId, users.id))
		.leftJoin(blueprints, eq(blueprints.projectId, projects.id))
		.$dynamic();
	if (status) {
		query.where(
			eq(projects.status, status as (typeof projectStatuses)[number]),
		);
	}
	query.orderBy(desc(projects.id)).limit(limit);
	const rows = await query;
	return rows;
}

export async function findProjectForStatusChange(db: GreenShiftDb, id: number) {
	const [project] = await db
		.select({ id: projects.id, status: projects.status })
		.from(projects)
		.where(eq(projects.id, id))
		.limit(1);
	return project;
}

/** Updates the project status and records the audit entry in one batch. */
export async function applyProjectStatusChange(
	db: GreenShiftDb,
	input: {
		id: number;
		status: (typeof projectStatuses)[number];
		actorId: number;
		from: string;
	},
): Promise<void> {
	await db.batch([
		db
			.update(projects)
			.set({
				status: input.status,
				completedAt: input.status === "completed" ? new Date() : undefined,
			})
			.where(eq(projects.id, input.id)),
		db.insert(auditLogs).values({
			userId: input.actorId,
			action: "project.status_changed",
			entityType: "project",
			entityId: input.id,
			projectId: input.id,
			metadata: { from: input.from, to: input.status },
		}),
	]);
}
