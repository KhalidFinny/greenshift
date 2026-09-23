import { asc, eq } from "drizzle-orm";
import type { BlueprintDocument } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, blueprints } from "../../../db/schema";

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

// The project's blueprint row, document included, or null while it has none. Read
// by the owning company at whatever stage it has reached.
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

// The row is written `validated`: LVV GRK already gated the project, and an admin
// still has to publish it. The audit entry is written after the row, which names it.
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
