import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import {
	auditLogs,
	blueprints,
	brokerAssignments,
	brokerProfiles,
	projects,
	tenders,
	users,
} from "../../../db/schema";

export type BrokerOptionRow = {
	id: number;
	firmName: string;
	representative: string | null;
	licenseNumber: string | null;
	licenseAuthority: string | null;
	address: string | null;
};

export async function listVerifiedBrokers(
	db: GreenShiftDb,
): Promise<BrokerOptionRow[]> {
	return db
		.select({
			id: users.id,
			firmName: brokerProfiles.companyName,
			representative: brokerProfiles.representative,
			licenseNumber: brokerProfiles.financialLicenseNumber,
			licenseAuthority: brokerProfiles.licenseAuthority,
			address: brokerProfiles.address,
		})
		.from(brokerProfiles)
		.innerJoin(users, eq(users.id, brokerProfiles.userId))
		.where(and(eq(users.role, "broker"), isNotNull(brokerProfiles.verifiedAt)))
		.orderBy(asc(brokerProfiles.companyName));
}

export async function findVerifiedBroker(db: GreenShiftDb, brokerId: number) {
	const [row] = await db
		.select({ id: users.id, firmName: brokerProfiles.companyName })
		.from(brokerProfiles)
		.innerJoin(users, eq(users.id, brokerProfiles.userId))
		.where(
			and(
				eq(users.id, brokerId),
				eq(users.role, "broker"),
				isNotNull(brokerProfiles.verifiedAt),
			),
		)
		.limit(1);

	return row ?? null;
}

export type ProjectAssignmentRow = {
	brokerId: number;
	firmName: string | null;
	accountName: string;
	status: string;
	assignedAt: Date;
	declineReason: string | null;
};

export async function findProjectAssignment(
	db: GreenShiftDb,
	projectId: number,
	companyId: number,
): Promise<ProjectAssignmentRow | null> {
	const [row] = await db
		.select({
			brokerId: brokerAssignments.brokerId,
			firmName: brokerProfiles.companyName,
			accountName: users.name,
			status: brokerAssignments.status,
			assignedAt: brokerAssignments.assignedAt,
			declineReason: brokerAssignments.declineReason,
		})
		.from(brokerAssignments)
		.innerJoin(projects, eq(projects.id, brokerAssignments.projectId))
		.innerJoin(users, eq(users.id, brokerAssignments.brokerId))
		.leftJoin(
			brokerProfiles,
			eq(brokerProfiles.userId, brokerAssignments.brokerId),
		)
		.where(
			and(
				eq(brokerAssignments.projectId, projectId),
				eq(projects.companyId, companyId),
			),
		)
		.orderBy(desc(brokerAssignments.id))
		.limit(1);

	return row ?? null;
}

export async function findProjectTender(
	db: GreenShiftDb,
	projectId: number,
	companyId: number,
) {
	const [row] = await db
		.select({
			status: tenders.status,
			awardedProposalId: tenders.awardedProposalId,
		})
		.from(tenders)
		.innerJoin(projects, eq(projects.id, tenders.projectId))
		.where(
			and(eq(tenders.projectId, projectId), eq(projects.companyId, companyId)),
		)
		.orderBy(desc(tenders.id))
		.limit(1);

	return row ?? null;
}

export async function insertAssignment(
	db: GreenShiftDb,
	values: typeof brokerAssignments.$inferInsert,
) {
	const [row] = await db.insert(brokerAssignments).values(values).returning();
	return row;
}

export async function recordAudit(
	db: GreenShiftDb,
	entry: typeof auditLogs.$inferInsert,
): Promise<void> {
	await db.insert(auditLogs).values(entry);
}

/** A project is verified once its blueprint has been validated or published. */
export async function findProjectVerified(
	db: GreenShiftDb,
	projectId: number,
): Promise<boolean> {
	const [row] = await db
		.select({ id: blueprints.id })
		.from(blueprints)
		.where(
			and(
				eq(blueprints.projectId, projectId),
				inArray(blueprints.status, ["validated", "published"]),
			),
		)
		.limit(1);
	return row !== undefined;
}
