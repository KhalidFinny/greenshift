import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import type {
	BrokerMilestone,
	BrokerMonthlyReport,
	BrokerNotification,
	BrokerProjectDocument,
	BrokerRiskAssessment,
} from "../../contracts";
import { createDb, type GreenShiftDb } from "../../db";
import {
	brokerAssignments,
	brokerProfiles,
	type emissionReports,
	notifications,
	type projectDocuments,
	type projectMilestones,
	projects,
	type riskAssessments,
	users,
} from "../../db/schema";
import type { ApiEnv } from "../../env";
import { iso } from "../../lib/format";
import { ApiFailure } from "../../lib/response";

/**
 * A broker that is not verified cannot receive or process projects (§6, rule 1).
 * Applied to every broker route that exposes project data.
 */
export const requireVerifiedBroker = createMiddleware<ApiEnv>(
	async (c, next) => {
		const db = createDb(c.env.DB);
		const [profile] = await db
			.select({ id: brokerProfiles.id, verifiedAt: brokerProfiles.verifiedAt })
			.from(brokerProfiles)
			.where(eq(brokerProfiles.userId, c.get("user").id))
			.limit(1);

		if (!profile?.verifiedAt) {
			throw new ApiFailure(
				"VERIFICATION_REQUIRED",
				"Broker verification must be completed before processing projects",
			);
		}
		await next();
	},
);

// ── risk (§14, read-only for the broker) ─────────────────
/** Scores are stored 0-100 where higher means more risk. */
export function riskLevel(score: number | null): string | null {
	if (score === null) return null;
	if (score < 35) return "Low";
	if (score < 65) return "Medium";
	return "High";
}

export function toRiskAssessment(
	row: typeof riskAssessments.$inferSelect | undefined,
): BrokerRiskAssessment {
	if (!row) {
		return {
			overallRiskLevel: null,
			financialRisk: null,
			technicalRisk: null,
			implementationRisk: null,
			environmentalRisk: null,
			notes: null,
		};
	}
	return {
		overallRiskLevel: riskLevel(row.overallScore),
		financialRisk: riskLevel(row.financialScore),
		technicalRisk: riskLevel(row.technicalScore),
		implementationRisk: riskLevel(row.implementationScore),
		environmentalRisk: riskLevel(row.environmentalScore),
		notes: row.notes,
	};
}

export function toProjectDocument(
	row: typeof projectDocuments.$inferSelect,
): BrokerProjectDocument {
	return {
		id: row.id,
		type: row.type,
		fileName: row.fileName,
		fileUrl: row.fileUrl,
		uploadedAt: row.uploadedAt.toISOString(),
	};
}

export function toMilestone(
	row: typeof projectMilestones.$inferSelect,
): BrokerMilestone {
	return {
		id: row.id,
		stepNumber: row.stepNumber,
		title: row.title,
		status: row.status,
		completionPercent: row.completionPercent,
		startDate: iso(row.startDate),
		dueDate: iso(row.dueDate),
	};
}

export function toNotification(
	row: typeof notifications.$inferSelect,
): BrokerNotification {
	return {
		id: row.id,
		category: row.type,
		title: row.title,
		message: row.body,
		createdAt: row.createdAt.toISOString(),
		isRead: row.read,
		linkUrl: row.link,
	};
}

/** Notifications the broker is expected to receive (§38). */
export async function notify(
	db: GreenShiftDb,
	userId: number,
	entry: { type: string; title: string; body: string; link: string },
): Promise<void> {
	await db.insert(notifications).values({
		userId,
		type: entry.type,
		title: entry.title,
		body: entry.body,
		link: entry.link,
	});
}

// ── assignment lookup ────────────────────────────────────
export interface AssignmentRow {
	assignment: typeof brokerAssignments.$inferSelect;
	project: typeof projects.$inferSelect;
	company: typeof users.$inferSelect;
}

/** Owner-scoped assignment: a broker only ever sees its own rows. */
export async function getAssignment(
	db: GreenShiftDb,
	brokerId: number,
	projectId: number,
): Promise<AssignmentRow | null> {
	const [row] = await db
		.select({
			assignment: brokerAssignments,
			project: projects,
			company: users,
		})
		.from(brokerAssignments)
		.innerJoin(projects, eq(brokerAssignments.projectId, projects.id))
		.innerJoin(users, eq(brokerAssignments.companyId, users.id))
		.where(
			and(
				eq(brokerAssignments.brokerId, brokerId),
				eq(brokerAssignments.projectId, projectId),
			),
		)
		.limit(1);
	return row ?? null;
}

// ── monthly report composition (§30-§34) ─────────────────
function clampPercent(value: number): number {
	return Math.max(0, Math.min(100, Math.round(value)));
}

export interface ReportSource {
	report: typeof emissionReports.$inferSelect;
	assignment: typeof brokerAssignments.$inferSelect;
	project: typeof projects.$inferSelect;
	company: typeof users.$inferSelect;
	vendorName: string | null;
	proposalRoi: number | null;
	milestones: Array<typeof projectMilestones.$inferSelect>;
	periodDays: number;
}

interface ReportExtras {
	plannedProgressPercent?: number;
	plannedBudgetAmount?: number;
	actualSpendingAmount?: number;
	expectedEnergySavingsKwh?: number;
	expectedCarbonReductionTons?: number;
	projectedRoiPercent?: number;
	actualRoiPerformancePercent?: number;
	overallStatus?: string;
	detectedRisksOrAnomalies?: string[];
	overallConclusion?: string;
}

/**
 * Compose the official monthly report for one MRV row. Progress is derived from
 * the project's milestones, energy and carbon from the MRV measurement, and the
 * remaining figures come from the report payload the Company and Vendor
 * published (reportData) - nothing is invented.
 */
export function composeReport(source: ReportSource): BrokerMonthlyReport {
	const {
		report,
		project,
		company,
		vendorName,
		proposalRoi,
		milestones,
		periodDays,
	} = source;
	const extras = (report.reportData as ReportExtras | null) ?? {};

	const actualProgressPercent = milestones.length
		? clampPercent(
				milestones.reduce(
					(sum, milestone) => sum + (milestone.completionPercent ?? 0),
					0,
				) / milestones.length,
			)
		: 0;

	// Planned progress is the linear share of the delivery window that has
	// elapsed by the end of the reporting period.
	let plannedProgressPercent = 0;
	const starts = milestones
		.map((milestone) => milestone.startDate)
		.filter((date): date is Date => date !== null);
	const ends = milestones
		.map((milestone) => milestone.dueDate)
		.filter((date): date is Date => date !== null);
	const periodEnd = report.periodEnd ?? report.periodStart ?? report.createdAt;
	if (starts.length && ends.length) {
		const windowStart = Math.min(...starts.map((date) => date.getTime()));
		const windowEnd = Math.max(...ends.map((date) => date.getTime()));
		const span = windowEnd - windowStart;
		plannedProgressPercent =
			span > 0
				? clampPercent(((periodEnd.getTime() - windowStart) / span) * 100)
				: 100;
	}

	const yearShare = periodDays / 365;
	const plannedBudget =
		extras.plannedBudgetAmount !== undefined
			? Math.round(extras.plannedBudgetAmount)
			: Math.round((project.budget ?? 0) * (plannedProgressPercent / 100));
	const actualSpending =
		extras.actualSpendingAmount !== undefined
			? Math.round(extras.actualSpendingAmount)
			: Math.round((project.budget ?? 0) * (actualProgressPercent / 100));

	const savedKwh =
		report.baselineConsumption !== null && report.actualConsumption !== null
			? report.baselineConsumption - report.actualConsumption
			: 0;
	const expectedEnergy =
		extras.expectedEnergySavingsKwh ??
		Math.round((project.estimatedEnergySaving ?? 0) * yearShare);
	const actualCarbon = report.emissionReduction ?? 0;
	const expectedCarbon =
		extras.expectedCarbonReductionTons ??
		Math.round((project.targetEmissionReduction ?? 0) * yearShare * 10) / 10;

	const projectedRoiPercent = extras.projectedRoiPercent ?? proposalRoi ?? 0;
	const actualRoiPercent = extras.actualRoiPerformancePercent ?? 0;

	const detectedRisks =
		extras.detectedRisksOrAnomalies ??
		(report.anomalyFlagged
			? [
					report.anomalyNote ??
						"Measured consumption deviates from the expected range.",
				]
			: []);

	const overallStatus =
		extras.overallStatus ??
		(report.anomalyFlagged
			? "AT_RISK"
			: actualProgressPercent + 5 < plannedProgressPercent
				? "ATTENTION_REQUIRED"
				: actualProgressPercent < plannedProgressPercent
					? "ATTENTION_REQUIRED"
					: "ON_TRACK");

	const overallConclusion =
		extras.overallConclusion ??
		`Implementation is at ${actualProgressPercent}% against a planned ${plannedProgressPercent}% for the period. ` +
			`Measured energy savings are ${savedKwh.toLocaleString("en-US")} kWh and measured emission reduction is ${actualCarbon} tCO2e. ` +
			(detectedRisks.length
				? `${detectedRisks.length} issue(s) are recorded for this period.`
				: "No new issues were recorded for this period.");

	return {
		id: report.id,
		projectId: project.id,
		projectTitle: project.title,
		companyName: company.name,
		vendorName,
		period: (report.periodStart ?? report.createdAt).toISOString().slice(0, 7),
		overallStatus,
		plannedProgressPercent,
		actualProgressPercent,
		completedMilestonesCount: milestones.filter(
			(milestone) => milestone.status === "APPROVED",
		).length,
		currentMilestoneTitle:
			milestones
				.slice()
				.sort((a, b) => a.stepNumber - b.stepNumber)
				.find((milestone) => milestone.status !== "APPROVED")?.title ?? null,
		plannedBudgetAmount: plannedBudget,
		actualSpendingAmount: actualSpending,
		expectedEnergySavingsKwh: expectedEnergy,
		actualEnergySavingsKwh: savedKwh,
		expectedCarbonReductionTons: expectedCarbon,
		actualCarbonReductionTons: actualCarbon,
		projectedRoiPercent,
		actualRoiPerformancePercent: actualRoiPercent,
		detectedRisksOrAnomalies: detectedRisks,
		overallConclusion,
		submittedAt: report.createdAt.toISOString(),
		pdfPath: `/api/broker/reports/${report.id}/pdf`,
	};
}
