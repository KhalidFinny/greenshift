import type {
	VendorEnergyForecast,
	VendorMilestone,
	VendorMilestoneEvidence,
	VendorMonthlyReport,
} from "../../contracts";
import type {
	emissionReports,
	energyForecasts,
	milestoneEvidence,
	projectMilestones,
} from "../../db/schema";
import { iso } from "../../lib/format";

export function evidenceEntry(
	row: typeof milestoneEvidence.$inferSelect,
): VendorMilestoneEvidence {
	return {
		id: row.id,
		kind: row.kind,
		fileName: row.fileName,
		fileUrl: row.fileUrl,
		notes: row.notes,
		uploadedAt: row.uploadedAt.toISOString(),
	};
}

export function milestoneEntry(
	row: typeof projectMilestones.$inferSelect,
	evidence: Array<typeof milestoneEvidence.$inferSelect>,
): VendorMilestone {
	return {
		id: row.id,
		stepNumber: row.stepNumber,
		title: row.title,
		description: row.description,
		startDate: iso(row.startDate),
		dueDate: iso(row.dueDate),
		completionPercent: row.completionPercent ?? 0,
		status: row.status,
		vendorNotes: row.vendorNotes,
		companyReviewNotes: row.companyReviewNotes,
		evidence: evidence.map(evidenceEntry),
	};
}

export function forecastEntry(
	row: typeof energyForecasts.$inferSelect,
): VendorEnergyForecast {
	return {
		periodStart: iso(row.periodStart),
		periodEnd: iso(row.periodEnd),
		forecastedConsumption: row.forecastedConsumption,
		forecastedSavings: row.forecastedSavings,
		modelName: row.modelName,
		metrics: row.metrics ?? null,
	};
}

export function monthlyReportEntry(
	row: typeof emissionReports.$inferSelect,
): VendorMonthlyReport {
	const reportData = row.reportData as { evidenceDocs?: string[] } | null;
	const saved =
		row.baselineConsumption !== null && row.actualConsumption !== null
			? row.baselineConsumption - row.actualConsumption
			: null;
	return {
		id: row.id,
		projectId: row.projectId,
		period: row.periodStart
			? row.periodStart.toISOString().slice(0, 7)
			: row.createdAt.toISOString().slice(0, 7),
		periodStart: iso(row.periodStart),
		periodEnd: iso(row.periodEnd),
		actualConsumption: row.actualConsumption,
		baselineConsumption: row.baselineConsumption,
		energySavedKwh: saved,
		carbonSavedTons: row.emissionReduction,
		evidenceDocs: reportData?.evidenceDocs ?? [],
		submittedAt: row.createdAt.toISOString(),
	};
}
