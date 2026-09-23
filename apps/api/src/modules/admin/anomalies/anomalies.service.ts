import type { AdminAnomaly } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import {
	countBySeverity,
	createAnomalyCollector,
	sortAnomalies,
} from "./anomaly-report";
import { collectCompletenessAnomalies } from "./completeness.detectors";
import { collectEnvironmentAnomalies } from "./environment.detectors";
import { collectFundingAnomalies } from "./funding.detectors";
import { collectProcurementAnomalies } from "./procurement.detectors";

export type AnomalyReport = {
	flags: AdminAnomaly[];
	counts: Record<AdminAnomaly["severity"] | "total", number>;
};

export async function detectAnomalies(
	db: GreenShiftDb,
): Promise<AnomalyReport> {
	const { flags, push } = createAnomalyCollector();

	await collectEnvironmentAnomalies(db, push);
	await collectFundingAnomalies(db, push);
	await collectProcurementAnomalies(db, push);
	await collectCompletenessAnomalies(db, push);

	sortAnomalies(flags);
	return { flags: flags.slice(0, 100), counts: countBySeverity(flags) };
}
