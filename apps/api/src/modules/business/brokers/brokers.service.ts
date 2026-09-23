import type {
	BusinessBrokerOption,
	BusinessProjectBroker,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { insertNotification } from "../notifications/notifications.repository";
import * as projectsRepository from "../projects/projects.repository";
import * as repository from "./brokers.repository";

export async function listBrokerOptions(
	db: GreenShiftDb,
): Promise<BusinessBrokerOption[]> {
	return repository.listVerifiedBrokers(db);
}

export type ProjectBrokerResult =
	| {
			outcome: "ok";
			ready: boolean;
			assignment: BusinessProjectBroker | null;
	  }
	| { outcome: "not_found" };

const VERIFIED_PROJECT_STATUSES = ["funding", "registry", "monitoring"];

function toAssignment(
	row: repository.ProjectAssignmentRow,
): BusinessProjectBroker {
	return {
		brokerId: row.brokerId,
		firmName: row.firmName ?? row.accountName,
		status: row.status,
		assignedAt: row.assignedAt.toISOString(),
		declineReason: row.declineReason,
	};
}

export async function readProjectBroker(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
): Promise<ProjectBrokerResult> {
	const project = await projectsRepository.findCompanyProject(
		db,
		projectId,
		companyId,
	);
	if (!project) return { outcome: "not_found" };

	const [assignment, tender, verified] = await Promise.all([
		repository.findProjectAssignment(db, projectId, companyId),
		repository.findProjectTender(db, projectId, companyId),
		repository.findProjectVerified(db, projectId),
	]);

	return {
		outcome: "ok",
		ready:
			verified ||
			VERIFIED_PROJECT_STATUSES.includes(project.status) ||
			(tender?.status === "awarded" && tender.awardedProposalId !== null),
		assignment: assignment ? toAssignment(assignment) : null,
	};
}

export type AssignBrokerResult =
	| { outcome: "ok"; assignment: BusinessProjectBroker }
	| { outcome: "not_found" }
	| { outcome: "not_awarded" }
	| { outcome: "already_assigned"; firmName: string }
	| { outcome: "unknown_broker" };

export interface AssignBrokerInput {
	companyId: number;
	companyName: string;
	projectId: number;
	brokerId: number;
}

export async function assignBroker(
	db: GreenShiftDb,
	input: AssignBrokerInput,
): Promise<AssignBrokerResult> {
	const { companyId, companyName, projectId, brokerId } = input;

	const project = await projectsRepository.findCompanyProject(
		db,
		projectId,
		companyId,
	);
	if (!project) return { outcome: "not_found" };

	const [tender, existing, verified] = await Promise.all([
		repository.findProjectTender(db, projectId, companyId),
		repository.findProjectAssignment(db, projectId, companyId),
		repository.findProjectVerified(db, projectId),
	]);
	if (
		!verified &&
		!VERIFIED_PROJECT_STATUSES.includes(project.status) &&
		(!tender ||
			tender.status !== "awarded" ||
			tender.awardedProposalId === null)
	) {
		return { outcome: "not_awarded" };
	}
	if (existing) {
		return {
			outcome: "already_assigned",
			firmName: existing.firmName ?? existing.accountName,
		};
	}

	const broker = await repository.findVerifiedBroker(db, brokerId);
	if (!broker) return { outcome: "unknown_broker" };

	const row = await repository.insertAssignment(db, {
		projectId,
		brokerId,
		companyId,
		status: "ASSIGNED",
		assignedAt: new Date(),
	});

	await insertNotification(db, {
		userId: brokerId,
		type: "assignment",
		title: `New assignment: ${project.title}`,
		body: `${companyName} chose your firm for this project.`,
		link: "/broker/projects",
	});

	await repository.recordAudit(db, {
		userId: companyId,
		projectId,
		action: "broker.assignment_created",
		entityType: "broker_assignment",
		entityId: row.id,
		metadata: { brokerId, firmName: broker.firmName },
	});

	return {
		outcome: "ok",
		assignment: {
			brokerId,
			firmName: broker.firmName,
			status: row.status,
			assignedAt: row.assignedAt.toISOString(),
			declineReason: row.declineReason,
		},
	};
}
