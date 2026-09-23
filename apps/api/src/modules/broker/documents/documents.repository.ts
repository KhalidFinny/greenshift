import { and, desc, eq, inArray } from "drizzle-orm";
import type { BrokerDocumentRequest } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import {
	brokerAssignments,
	documentRequests,
	organizationName,
	projects,
	users,
} from "../../../db/schema";

export type DocumentRequestRow = typeof documentRequests.$inferSelect;
export type BrokerAssignmentRow = typeof brokerAssignments.$inferSelect;

export function toDocumentRequest(
	row: DocumentRequestRow,
	projectTitle: string,
	companyName: string,
): BrokerDocumentRequest {
	return {
		id: row.id,
		projectId: row.projectId,
		projectTitle,
		companyName,
		category: row.category,
		documentTypeName: row.documentTypeName,
		requiredPeriod: row.requiredPeriod,
		reason: row.reason,
		deadlineDate: row.deadlineDate
			? row.deadlineDate.toISOString().slice(0, 10)
			: null,
		additionalNotes: row.additionalNotes,
		status: row.status,
		submittedFileName: row.submittedFileName,
		submittedFileUrl: row.submittedFileUrl,
		submittedAt: row.submittedAt?.toISOString() ?? null,
		rejectionReason: row.rejectionReason,
		reviewedAt: row.reviewedAt?.toISOString() ?? null,
	};
}

export interface DocumentContext {
	projectTitle: string;
	companyName: string;
}

export async function loadDocumentContext(
	db: GreenShiftDb,
	rows: DocumentRequestRow[],
): Promise<Map<number, DocumentContext>> {
	const context = new Map<number, DocumentContext>();
	if (rows.length === 0) return context;

	const projectRows = await db
		.select({
			id: projects.id,
			title: projects.title,
			companyName: organizationName,
		})
		.from(projects)
		.innerJoin(users, eq(projects.companyId, users.id))
		.where(
			inArray(projects.id, [...new Set(rows.map((row) => row.projectId))]),
		);
	const byProject = new Map(projectRows.map((row) => [row.id, row]));

	for (const row of rows) {
		const project = byProject.get(row.projectId);
		context.set(row.id, {
			projectTitle: project?.title ?? "Project",
			companyName: project?.companyName ?? "Company",
		});
	}
	return context;
}

/** Document requests of one broker, newest first. */
export function listDocumentRequests(
	db: GreenShiftDb,
	brokerId: number,
	limit: number,
) {
	return db
		.select()
		.from(documentRequests)
		.where(eq(documentRequests.brokerId, brokerId))
		.orderBy(desc(documentRequests.createdAt))
		.limit(limit);
}

/** Owner-scoped document request: a broker only ever sees its own rows. */
export async function getDocumentRequest(
	db: GreenShiftDb,
	id: number,
	brokerId: number,
): Promise<DocumentRequestRow | undefined> {
	const [row] = await db
		.select()
		.from(documentRequests)
		.where(
			and(eq(documentRequests.id, id), eq(documentRequests.brokerId, brokerId)),
		)
		.limit(1);
	return row;
}

/** Owner-scoped assignment used to authorise a new document request (§22). */
export async function getBrokerAssignment(
	db: GreenShiftDb,
	brokerId: number,
	projectId: number,
): Promise<BrokerAssignmentRow | undefined> {
	const [assignment] = await db
		.select()
		.from(brokerAssignments)
		.where(
			and(
				eq(brokerAssignments.brokerId, brokerId),
				eq(brokerAssignments.projectId, projectId),
			),
		)
		.limit(1);
	return assignment;
}

export function insertDocumentRequest(
	db: GreenShiftDb,
	values: typeof documentRequests.$inferInsert,
) {
	return db.insert(documentRequests).values(values).returning();
}

export function updateDocumentRequest(
	db: GreenShiftDb,
	id: number,
	patch: Partial<typeof documentRequests.$inferInsert>,
) {
	return db
		.update(documentRequests)
		.set(patch)
		.where(eq(documentRequests.id, id))
		.returning();
}

/** Project title and company name shown on a freshly created request. */
export async function getProjectSummary(
	db: GreenShiftDb,
	projectId: number,
): Promise<{ title: string; companyName: string } | undefined> {
	const [project] = await db
		.select({ title: projects.title, companyName: organizationName })
		.from(projects)
		.innerJoin(users, eq(projects.companyId, users.id))
		.where(eq(projects.id, projectId))
		.limit(1);
	return project;
}
