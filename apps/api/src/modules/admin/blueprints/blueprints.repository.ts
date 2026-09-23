import { desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, blueprints, projects } from "../../../db/schema";

/** Blueprints with their project title, newest first. */
export async function listBlueprints(
	db: GreenShiftDb,
	status: string | undefined,
	limit: number,
) {
	const query = db
		.select({ blueprint: blueprints, projectTitle: projects.title })
		.from(blueprints)
		.innerJoin(projects, eq(blueprints.projectId, projects.id))
		.$dynamic();
	if (status) query.where(eq(blueprints.status, status));
	query.orderBy(desc(blueprints.id)).limit(limit);
	const rows = await query;
	return rows;
}

export async function findBlueprintForTransition(db: GreenShiftDb, id: number) {
	const [blueprint] = await db
		.select()
		.from(blueprints)
		.where(eq(blueprints.id, id))
		.limit(1);
	return blueprint;
}

/** Persists the status transition and its audit entry in one batch. */
export async function applyBlueprintTransition(
	db: GreenShiftDb,
	input: {
		id: number;
		status: string;
		auditNote: string | null;
		auditorId: number | null;
		validatedAt: Date | null;
		publishedAt: Date | null;
		actorId: number;
		projectId: number;
		from: string;
	},
): Promise<void> {
	await db.batch([
		db
			.update(blueprints)
			.set({
				status: input.status,
				auditNote: input.auditNote,
				auditorId: input.auditorId,
				validatedAt: input.validatedAt,
				publishedAt: input.publishedAt,
			})
			.where(eq(blueprints.id, input.id)),
		db.insert(auditLogs).values({
			userId: input.actorId,
			action: "blueprint.status_changed",
			entityType: "blueprint",
			entityId: input.id,
			projectId: input.projectId,
			metadata: {
				from: input.from,
				to: input.status,
				auditNote: input.auditNote,
				auditorId: input.auditorId,
			},
		}),
	]);
}

export async function findProjectStatus(db: GreenShiftDb, id: number) {
	const [project] = await db
		.select({ id: projects.id, status: projects.status })
		.from(projects)
		.where(eq(projects.id, id))
		.limit(1);
	return project;
}

export async function promoteProjectToFunding(
	db: GreenShiftDb,
	id: number,
): Promise<void> {
	await db
		.update(projects)
		.set({ status: "funding" })
		.where(eq(projects.id, id));
}
