// A project row as the screens read it back: the stored figures, and the risk level following the stored score.

import type {
	BusinessProjectSummary,
	BusinessSubmittedProject,
} from "../../../contracts";
import type { projects } from "../../../db/schema";
import { iso } from "../../../lib/format";
import { levelForRiskScore } from "../business.scoring";
import { pillStatus } from "../business.shared";

type ProjectRow = typeof projects.$inferSelect;

export function toSubmittedProject(row: ProjectRow): BusinessSubmittedProject {
	return {
		id: row.id,
		title: row.title,
		status: row.status,
		statusLabel: pillStatus(row.status),
		submittedAt: iso(row.submittedAt),
		baselineTco2:
			row.konsumsiMwh !== null && row.faktorEmisi !== null
				? row.konsumsiMwh * row.faktorEmisi
				: null,
		creditScore: row.creditScore,
		creditRating: row.creditRating,
		riskScore: row.riskScore,
		riskLevel: row.riskScore === null ? null : levelForRiskScore(row.riskScore),
		location: row.location,
		sector: row.industrySector,
		funding: {
			capexRp: row.capexRp,
			tenorTahun: row.tenorTahun,
			penghematanRp: row.penghematanRp,
			pendapatanRp: row.pendapatanRp,
			jaminan: row.jaminan,
		},
		technicalRequirements: row.technicalRequirements ?? [],
		deliverables: row.deliverables ?? [],
	};
}

export function toProjectSummary(row: ProjectRow): BusinessProjectSummary {
	return {
		id: row.id,
		name: row.title,
		location: row.location,
		sector: row.industrySector,
		submittedAt: iso(row.submittedAt),
		capexRp: row.capexRp,
		status: pillStatus(row.status),
	};
}
