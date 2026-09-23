import { and, desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	negotiations,
	organizationName,
	projects,
	proposalRevisions,
	proposals,
	tenders,
	users,
} from "../../../db/schema";

export interface NegotiationRow {
	negotiation: typeof negotiations.$inferSelect;
	projectTitle: string;
	companyName: string | null;
	projectId: number;
}

// Owner-scoped negotiation rows with the project/company they belong to.
function negotiationSelection() {
	return {
		negotiation: negotiations,
		projectTitle: projects.title,
		companyName: organizationName,
		projectId: projects.id,
	};
}

export async function listNegotiationRows(
	db: GreenShiftDb,
	vendorId: number,
): Promise<NegotiationRow[]> {
	return db
		.select(negotiationSelection())
		.from(negotiations)
		.innerJoin(proposals, eq(negotiations.proposalId, proposals.id))
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.innerJoin(users, eq(projects.companyId, users.id))
		.where(eq(proposals.vendorId, vendorId))
		.orderBy(desc(negotiations.updatedAt));
}

export async function findNegotiationRow(
	db: GreenShiftDb,
	id: number,
	vendorId: number,
) {
	const [row] = await db
		.select({
			negotiation: negotiations,
			proposal: proposals,
			projectId: projects.id,
		})
		.from(negotiations)
		.innerJoin(proposals, eq(negotiations.proposalId, proposals.id))
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.where(and(eq(negotiations.id, id), eq(proposals.vendorId, vendorId)))
		.limit(1);

	return row;
}

export async function updateNegotiationResponse(
	db: GreenShiftDb,
	id: number,
	values: Partial<typeof negotiations.$inferInsert>,
): Promise<void> {
	await db.update(negotiations).set(values).where(eq(negotiations.id, id));
}

export async function updateProposalAfterNegotiation(
	db: GreenShiftDb,
	proposalId: number,
	values: { amount: number; revisionCount: number },
): Promise<void> {
	await db
		.update(proposals)
		.set({
			amount: values.amount,
			status: "submitted",
			revisionCount: values.revisionCount,
		})
		.where(eq(proposals.id, proposalId));
}

export async function insertProposalRevision(
	db: GreenShiftDb,
	values: typeof proposalRevisions.$inferInsert,
): Promise<void> {
	await db.insert(proposalRevisions).values(values);
}

export async function loadNegotiation(
	db: GreenShiftDb,
	id: number,
): Promise<NegotiationRow | undefined> {
	const [updated] = await db
		.select(negotiationSelection())
		.from(negotiations)
		.innerJoin(proposals, eq(negotiations.proposalId, proposals.id))
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.innerJoin(projects, eq(tenders.projectId, projects.id))
		.innerJoin(users, eq(projects.companyId, users.id))
		.where(eq(negotiations.id, id))
		.limit(1);

	return updated;
}
