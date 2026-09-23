import type { GreenShiftDb } from "../../../db";
import type { projectStatuses } from "../../../db/schema";
import {
	applyProjectStatusChange,
	findProjectForStatusChange,
} from "./projects.repository";

export type ChangeProjectStatusResult =
	| { ok: true }
	| { ok: false; reason: "not_found" };

/**
 * Moves a project to a new lifecycle status, stamping `completedAt` on
 * completion, and records the transition in the audit trail.
 */
export async function changeProjectStatus(
	db: GreenShiftDb,
	input: {
		id: number;
		status: (typeof projectStatuses)[number];
		actorId: number;
	},
): Promise<ChangeProjectStatusResult> {
	const project = await findProjectForStatusChange(db, input.id);
	if (!project) return { ok: false, reason: "not_found" };

	await applyProjectStatusChange(db, {
		id: input.id,
		status: input.status,
		actorId: input.actorId,
		from: project.status,
	});
	return { ok: true };
}
