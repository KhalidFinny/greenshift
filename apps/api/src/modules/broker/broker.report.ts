import type { BrokerMonthlyReport } from "../../contracts";
import type {
	brokerAssignments,
	emissionReports,
	projectMilestones,
	projects,
	users,
} from "../../db/schema";

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

function clampPercent(value: number): number {
	return Math.max(0, Math.min(100, Math.round(value)));
}

// Progress comes from milestones, energy and carbon from the MRV measurement, the rest from reportData.
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

	// Planned progress is the linear share of the delivery window elapsed by the period end.
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
