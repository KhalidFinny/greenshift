import type { GreenShiftDb } from "../../../db";
import type { blueprints } from "../../../db/schema";
import {
	applyBlueprintTransition,
	findBlueprintForTransition,
	findProjectStatus,
	promoteProjectToFunding,
} from "./blueprints.repository";

export const blueprintStatuses = [
	"draft",
	"audit",
	"validated",
	"rejected",
	"published",
] as const;

export type BlueprintStatus = (typeof blueprintStatuses)[number];

const blueprintTransitions: Record<string, readonly string[]> = {
	draft: ["audit"],
	audit: ["validated", "rejected"],
	validated: ["published"],
	rejected: ["audit"],
	published: [],
};

function isPublishableDocument(
	document: typeof blueprints.$inferSelect.document,
): boolean {
	const projections = document?.financialProjections;
	return (
		typeof projections?.irr === "number" &&
		Number.isFinite(projections.irr) &&
		projections.irr > 0 &&
		projections.irr <= 100 &&
		typeof projections?.paybackPeriod === "number" &&
		Number.isFinite(projections.paybackPeriod) &&
		projections.paybackPeriod > 0
	);
}

export type UpdateBlueprintResult =
	| { ok: true }
	| { ok: false; reason: "not_found" }
	| { ok: false; reason: "invalid_transition" }
	| { ok: false; reason: "not_publishable" };

/**
 * Auditor gatekeeper workflow: validates the requested transition, checks the
 * blueprint is complete before publication, persists the change with its audit
 * entry, and opens the project for funding once published.
 */
export async function updateBlueprint(
	db: GreenShiftDb,
	input: {
		id: number;
		status: BlueprintStatus;
		auditNote: string | undefined;
		actorId: number;
	},
): Promise<UpdateBlueprintResult> {
	const { id, status, actorId } = input;
	const blueprint = await findBlueprintForTransition(db, id);
	if (!blueprint) return { ok: false, reason: "not_found" };

	const allowed = blueprintTransitions[blueprint.status] ?? [];
	if (!allowed.includes(status)) {
		return { ok: false, reason: "invalid_transition" };
	}
	if (status === "published" && !isPublishableDocument(blueprint.document)) {
		return { ok: false, reason: "not_publishable" };
	}

	await applyBlueprintTransition(db, {
		id,
		status,
		auditNote:
			typeof input.auditNote === "string"
				? input.auditNote
				: blueprint.auditNote,
		auditorId:
			status === "validated" || status === "published"
				? actorId
				: blueprint.auditorId,
		validatedAt: status === "validated" ? new Date() : blueprint.validatedAt,
		publishedAt: status === "published" ? new Date() : blueprint.publishedAt,
		actorId,
		projectId: blueprint.projectId,
		from: blueprint.status,
	});

	if (status === "published") {
		const project = await findProjectStatus(db, blueprint.projectId);
		const preFunding = ["draft", "assessment", "tendering", "blueprint"];
		if (project && preFunding.includes(project.status)) {
			await promoteProjectToFunding(db, project.id);
		}
	}

	return { ok: true };
}
