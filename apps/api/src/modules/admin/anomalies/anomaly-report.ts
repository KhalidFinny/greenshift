import type { AdminAnomaly } from "../../../contracts";
import { iso } from "../../../lib/format";

export interface AnomalyInput {
	category: string;
	code: string;
	severity: AdminAnomaly["severity"];
	title: string;
	detail: string;
	entityType: string | null;
	entityId: number | null;
	entityLabel: string | null;
	createdAt: Date | null;
}

export type AnomalyPush = (input: AnomalyInput) => void;

export interface AnomalyCollector {
	flags: AdminAnomaly[];
	push: AnomalyPush;
}

/** Read-only rule engine: the admin monitors, never mutates operational state. */
export function createAnomalyCollector(): AnomalyCollector {
	const flags: AdminAnomaly[] = [];
	return {
		flags,
		push(input) {
			flags.push({
				id: `${input.category}.${input.code}-${input.entityId ?? flags.length}`,
				code: input.code,
				category: input.category,
				severity: input.severity,
				title: input.title,
				description: input.detail,
				detail: input.detail,
				projectId: null,
				entityType: input.entityType,
				entityId: input.entityId,
				entityLabel: input.entityLabel,
				createdAt: iso(input.createdAt),
			});
		},
	};
}

const SEVERITY_RANK: Record<AdminAnomaly["severity"], number> = {
	critical: 0,
	high: 1,
	medium: 2,
	low: 3,
};

export function sortAnomalies(flags: AdminAnomaly[]): void {
	flags.sort(
		(a, b) =>
			SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
			(b.createdAt ?? "").localeCompare(a.createdAt ?? "") ||
			// Stable tiebreaker: rows sharing a severity and timestamp come back in arbitrary order otherwise.
			String(a.id).localeCompare(String(b.id)),
	);
}

export function countBySeverity(
	flags: AdminAnomaly[],
): Record<AdminAnomaly["severity"] | "total", number> {
	const counts = {
		critical: 0,
		high: 0,
		medium: 0,
		low: 0,
		total: flags.length,
	};
	for (const flag of flags) counts[flag.severity]++;
	return counts;
}
