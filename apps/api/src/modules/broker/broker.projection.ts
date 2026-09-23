import type {
	BrokerMilestone,
	BrokerNotification,
	BrokerProjectDocument,
	BrokerRiskAssessment,
} from "../../contracts";
import type {
	notifications,
	projectDocuments,
	projectMilestones,
	riskAssessments,
} from "../../db/schema";
import { iso } from "../../lib/format";

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
