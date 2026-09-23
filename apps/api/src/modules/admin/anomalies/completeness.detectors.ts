import type { GreenShiftDb } from "../../../db";
import {
	selectProjectsWithoutMrv,
	selectUnverifiedUsers,
	selectVendorsWithoutProfile,
} from "./anomalies.repository";
import type { AnomalyPush } from "./anomaly-report";

/** Records that exist without the profile, verification or reporting they are required to carry. */
export async function collectCompletenessAnomalies(
	db: GreenShiftDb,
	push: AnomalyPush,
): Promise<void> {
	for (const user of await selectUnverifiedUsers(db)) {
		push({
			category: "user",
			code: "unverified",
			severity: "medium",
			title: "Account not yet verified",
			detail: `${user.role} account ${user.email} is active without verification.`,
			entityType: "user",
			entityId: user.id,
			entityLabel: user.email,
			createdAt: user.createdAt,
		});
	}

	for (const { user } of await selectVendorsWithoutProfile(db)) {
		push({
			category: "vendor",
			code: "no_profile",
			severity: "medium",
			title: "Vendor without a profile",
			detail: `Vendor account ${user.email} has no vendor profile.`,
			entityType: "user",
			entityId: user.id,
			entityLabel: user.email,
			createdAt: user.createdAt,
		});
	}

	for (const { project } of await selectProjectsWithoutMrv(db)) {
		push({
			category: "project",
			code: "no_mrv",
			severity: "low",
			title: "Project without an MRV report",
			detail: `Project "${project.title}" has status ${project.status} with no emission reports.`,
			entityType: "project",
			entityId: project.id,
			entityLabel: project.title,
			createdAt: project.createdAt,
		});
	}
}
