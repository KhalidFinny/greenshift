import { and, desc, eq, inArray } from "drizzle-orm";
import type { BrokerMonthlyReport } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import {
	brokerAssignments,
	emissionReports,
	projectMilestones,
	projects,
	proposals,
	tenders,
	users,
	vendors,
} from "../../../db/schema";
import { composeReport, type ReportSource } from "../broker.shared";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PERIOD_DAYS = 30;

/** Reports are read-only for the broker: nothing here mutates project data. */
export async function loadReports(
	db: GreenShiftDb,
	brokerId: number,
	reportId?: number,
): Promise<BrokerMonthlyReport[]> {
	const where =
		reportId === undefined
			? eq(brokerAssignments.brokerId, brokerId)
			: and(
					eq(brokerAssignments.brokerId, brokerId),
					eq(emissionReports.id, reportId),
				);

	const rows = await db
		.select({
			report: emissionReports,
			assignment: brokerAssignments,
			project: projects,
			company: users,
		})
		.from(emissionReports)
		.innerJoin(
			brokerAssignments,
			eq(brokerAssignments.projectId, emissionReports.projectId),
		)
		.innerJoin(projects, eq(emissionReports.projectId, projects.id))
		.innerJoin(users, eq(brokerAssignments.companyId, users.id))
		.where(where)
		.orderBy(desc(emissionReports.createdAt))
		.limit(reportId === undefined ? 200 : 1);

	if (rows.length === 0) return [];

	const projectIds = [...new Set(rows.map((row) => row.project.id))];

	const milestoneRows = await db
		.select()
		.from(projectMilestones)
		.where(inArray(projectMilestones.projectId, projectIds))
		.orderBy(projectMilestones.stepNumber);
	const milestonesByProject = new Map<
		number,
		Array<typeof projectMilestones.$inferSelect>
	>();
	for (const row of milestoneRows) {
		const list = milestonesByProject.get(row.projectId) ?? [];
		list.push(row);
		milestonesByProject.set(row.projectId, list);
	}

	// The awarded vendor and the projected ROI feed the report context.
	const awarded = await db
		.select({
			projectId: tenders.projectId,
			projectedRoi: proposals.projectedRoi,
			vendorName: vendors.companyName,
			vendorUserName: users.name,
		})
		.from(proposals)
		.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
		.leftJoin(vendors, eq(proposals.vendorId, vendors.id))
		.leftJoin(users, eq(proposals.vendorId, users.id))
		.where(
			and(
				inArray(tenders.projectId, projectIds),
				eq(proposals.status, "accepted"),
			),
		)
		.orderBy(desc(proposals.submittedAt));
	const vendorByProject = new Map<
		number,
		{ name: string | null; roi: number | null }
	>();
	for (const row of awarded) {
		if (vendorByProject.has(row.projectId)) continue;
		vendorByProject.set(row.projectId, {
			name: row.vendorName ?? row.vendorUserName ?? null,
			roi: row.projectedRoi ?? null,
		});
	}

	return rows.map(({ report, assignment, project, company }) => {
		const start = report.periodStart?.getTime();
		const end = report.periodEnd?.getTime();
		const periodDays =
			start !== undefined && end !== undefined && end > start
				? Math.round((end - start) / DAY_MS)
				: DEFAULT_PERIOD_DAYS;
		const vendor = vendorByProject.get(project.id);
		const source: ReportSource = {
			report,
			assignment,
			project,
			company,
			vendorName: vendor?.name ?? null,
			proposalRoi: vendor?.roi ?? null,
			milestones: milestonesByProject.get(project.id) ?? [],
			periodDays,
		};
		return composeReport(source);
	});
}
