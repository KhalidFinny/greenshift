import { and, desc, eq, ne } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { drafts, projects, riskAssessments } from "../../../db/schema";
import type { ProjectRiskResult } from "../business.scoring";

/** The company's own project. Scoped, so another company's id reads as missing. */
export async function findCompanyProject(
	db: GreenShiftDb,
	projectId: number,
	companyId: number,
) {
	const [row] = await db
		.select()
		.from(projects)
		.where(and(eq(projects.id, projectId), eq(projects.companyId, companyId)))
		.limit(1);

	return row;
}

/** The company's submitted projects, newest first. Drafts never reach this list. */
export async function listCompanyProjects(
	db: GreenShiftDb,
	companyId: number,
	limit: number,
) {
	return db
		.select()
		.from(projects)
		.where(and(eq(projects.companyId, companyId), ne(projects.status, "draft")))
		.orderBy(desc(projects.submittedAt), desc(projects.id))
		.limit(limit);
}

export type NewProject = typeof projects.$inferInsert;

export async function setProjectStatus(
	db: GreenShiftDb,
	projectId: number,
	status: (typeof projects.$inferSelect)["status"],
) {
	const [row] = await db
		.update(projects)
		.set({ status, updatedAt: new Date() })
		.where(eq(projects.id, projectId))
		.returning();

	return row;
}

// Writes the project and its risk assessment together, so a project cannot exist without one.
export async function insertProjectWithRisk(
	db: GreenShiftDb,
	values: NewProject,
	risk: ProjectRiskResult,
): Promise<typeof projects.$inferSelect> {
	const [project] = await db.insert(projects).values(values).returning();

	const pctFor = (key: string) =>
		risk.breakdown.find((row) => row.key === key)?.pct ?? null;

	await db.insert(riskAssessments).values({
		projectId: project.id,
		financialScore: pctFor("finansial"),
		technicalScore: pctFor("teknis"),
		implementationScore: pctFor("implementasi"),
		// The wizard's model does not score an environmental dimension.
		environmentalScore: null,
		overallScore: risk.score,
		recommendations: risk.mitigations,
		notes: risk.summary,
		assessedBy: "system",
		assessedAt: new Date(),
	});

	return project;
}

// So a replay can be answered with the project the draft already created.
export async function attachProjectToDraft(
	db: GreenShiftDb,
	draftId: string,
	projectId: number,
): Promise<void> {
	await db.update(drafts).set({ projectId }).where(eq(drafts.id, draftId));
}

/** The written reading stored with a project's assessment, if it has one yet. */
export async function findRiskInsight(db: GreenShiftDb, projectId: number) {
	const [row] = await db
		.select({
			insight: riskAssessments.insight,
			source: riskAssessments.insightSource,
		})
		.from(riskAssessments)
		.where(eq(riskAssessments.projectId, projectId))
		.limit(1);

	return row ?? null;
}

// Called once per project: a read that finds nothing asks for a reading, later reads are served from the row.
export async function writeRiskInsight(
	db: GreenShiftDb,
	projectId: number,
	insight: string,
	source: string,
): Promise<void> {
	await db
		.update(riskAssessments)
		.set({ insight, insightSource: source })
		.where(eq(riskAssessments.projectId, projectId));
}
