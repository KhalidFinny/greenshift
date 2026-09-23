import { asc, eq } from "drizzle-orm";
import type { BlueprintDocument } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, blueprints } from "../../../db/schema";

/** The blueprint a project already carries, if it has one. */
export async function findBlueprintIdForProject(
	db: GreenShiftDb,
	projectId: number,
): Promise<number | null> {
	const [row] = await db
		.select({ id: blueprints.id })
		.from(blueprints)
		.where(eq(blueprints.projectId, projectId))
		.orderBy(asc(blueprints.id))
		.limit(1);

	return row?.id ?? null;
}

/**
 * The project's blueprint row, document included, or null while it has none.
 * Read by the company that owns the project, which reads its own document at
 * whatever stage it has reached.
 */
export async function findBlueprintForProject(
	db: GreenShiftDb,
	projectId: number,
): Promise<typeof blueprints.$inferSelect | null> {
	const [row] = await db
		.select()
		.from(blueprints)
		.where(eq(blueprints.projectId, projectId))
		.orderBy(asc(blueprints.id))
		.limit(1);

	return row ?? null;
}

/**
 * Writes the generated blueprint and its audit entry.
 *
 * The row is written as `validated`: LVV GRK is the body that verified the
 * project, so the document it is generated from has already been through the
 * gate the audit stage stands for. An admin can still publish it, which is the
 * step that opens the project for funding.
 *
 * The audit entry is written after the row because it names it: the admin
 * console reads a blueprint's history by entity id, so an entry without one
 * would be invisible there.
 */
export async function insertValidatedBlueprint(
	db: GreenShiftDb,
	input: {
		projectId: number;
		document: BlueprintDocument;
		/** Who triggered the write; null when it was the verification flow. */
		actorId: number | null;
		note: string;
	},
): Promise<{ id: number }> {
	const [blueprint] = await db
		.insert(blueprints)
		.values({
			projectId: input.projectId,
			status: "validated",
			document: input.document,
			auditNote: input.note,
			validatedAt: new Date(),
		})
		.returning({ id: blueprints.id });

	if (!blueprint) {
		throw new Error("The blueprint insert returned no row");
	}

	await db.insert(auditLogs).values({
		userId: input.actorId,
		action: "blueprint.generated",
		entityType: "blueprint",
		entityId: blueprint.id,
		projectId: input.projectId,
		metadata: { status: "validated", note: input.note },
	});

	return blueprint;
}
