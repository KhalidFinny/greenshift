// The company's own projects, as its list and detail screens read them.

import type {
	BusinessProjectSummary,
	BusinessSubmittedProject,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { toProjectSummary, toSubmittedProject } from "./project-view";
import * as repository from "./projects.repository";

export type { RegistryCheck, StartLvvResult } from "./project-lvv.service";
export {
	checkEnvironmentalRegistry,
	completeLvvReview,
	startLvvVerification,
} from "./project-lvv.service";
export type { SubmitResult } from "./project-submission.service";
export { submitProject } from "./project-submission.service";

export type ListResult =
	| { outcome: "ok"; projects: BusinessProjectSummary[] }
	| { outcome: "not_found" };

export async function readProject(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
): Promise<BusinessSubmittedProject | null> {
	const row = await repository.findCompanyProject(db, projectId, companyId);
	return row ? toSubmittedProject(row) : null;
}

export async function listProjects(
	db: GreenShiftDb,
	companyId: number,
	limit: number,
): Promise<BusinessProjectSummary[]> {
	const rows = await repository.listCompanyProjects(db, companyId, limit);
	return rows.map(toProjectSummary);
}
