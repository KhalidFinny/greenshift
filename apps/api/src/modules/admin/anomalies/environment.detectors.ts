import type { GreenShiftDb } from "../../../db";
import type { AnomalyPush } from "./anomaly-report";
import {
	selectAnomalousEmissionReports,
	selectRogueBlueprints,
} from "./anomalies.repository";

export async function collectEnvironmentAnomalies(
	db: GreenShiftDb,
	push: AnomalyPush,
): Promise<void> {
	for (const { blueprint, projectTitle } of await selectRogueBlueprints(db)) {
		push({
			category: "blueprint",
			code: "published_invalid",
			severity: "critical",
			title: "Blueprint published without validation",
			detail: `Blueprint for project "${projectTitle}" is published with no auditor validation trail.`,
			entityType: "blueprint",
			entityId: blueprint.id,
			entityLabel: projectTitle,
			createdAt: blueprint.publishedAt,
		});
	}

	for (const { report, projectTitle } of await selectAnomalousEmissionReports(
		db,
	)) {
		push({
			category: "emission",
			code: "anomaly",
			severity: "high",
			title: "Emission report anomaly detected",
			detail:
				report.anomalyNote ??
				`Actual consumption deviates from baseline (score ${report.anomalyScore ?? "?"}).`,
			entityType: "emission_report",
			entityId: report.id,
			entityLabel: projectTitle,
			createdAt: report.createdAt,
		});
	}
}
