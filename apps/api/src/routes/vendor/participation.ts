import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	VendorMyProject,
	VendorMyProjectDetail,
	VendorProcurementStatusItem,
} from "../../contracts";
import { createDb } from "../../db";
import {
	emissionReports,
	milestoneEvidence,
	projectMilestones,
	projects,
	proposalRevisions,
	proposals,
	tenders,
	users,
	vendors,
} from "../../db/schema";
import type { ApiEnv } from "../../env";
import {
	iso,
	milestoneEntry,
	monthlyReportEntry,
	parseLimit,
	revisionEntry,
	tenderSummary,
} from "./helpers";

const factory = createFactory<ApiEnv>();

export const participationRoutes = new Hono<ApiEnv>();

// ── projects the vendor participates in ───────────────────
participationRoutes.get(
	"/my-projects",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);
		if (!profile) return c.json({ projects: [] });

		const rows = await db
			.select({
				proposal: proposals,
				tender: tenders,
				project: projects,
				companyName: users.name,
			})
			.from(proposals)
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.innerJoin(users, eq(projects.companyId, users.id))
			.where(eq(proposals.vendorId, profile.id))
			.orderBy(desc(proposals.submittedAt))
			.limit(limit);

		// One row per project, keeping the latest proposal when a project
		// was tendered more than once.
		const byProject = new Map<number, VendorMyProject>();
		for (const { proposal, tender, project, companyName } of rows) {
			if (byProject.has(project.id)) continue;
			byProject.set(project.id, {
				project: {
					id: project.id,
					title: project.title,
					status: project.status,
					companyName,
					location: project.location,
					industrySector: project.industrySector,
					budget: project.budget,
					targetEmissionReduction: project.targetEmissionReduction,
					estimatedEnergySaving: project.estimatedEnergySaving,
				},
				tender: tenderSummary(tender),
				proposal: {
					id: proposal.id,
					amount: proposal.amount,
					status: proposal.status,
					revisionCount: proposal.revisionCount ?? 0,
					submittedAt: iso(proposal.submittedAt),
				},
			});
		}

		// Delivery data for the projects in this page, so the active-project
		// views do not need one request per project.
		const projects_ = [...byProject.values()];
		const projectIds = projects_.map((item) => item.project.id);
		if (projectIds.length) {
			const milestoneRows = await db
				.select()
				.from(projectMilestones)
				.where(inArray(projectMilestones.projectId, projectIds))
				.orderBy(projectMilestones.stepNumber);

			const milestoneIds = milestoneRows.map((milestone) => milestone.id);
			const evidenceRows = milestoneIds.length
				? await db
						.select()
						.from(milestoneEvidence)
						.where(inArray(milestoneEvidence.milestoneId, milestoneIds))
						.orderBy(milestoneEvidence.uploadedAt)
				: [];

			const reportRows = await db
				.select()
				.from(emissionReports)
				.where(inArray(emissionReports.projectId, projectIds))
				.orderBy(desc(emissionReports.periodStart));

			for (const item of projects_) {
				item.milestones = milestoneRows
					.filter((milestone) => milestone.projectId === item.project.id)
					.map((milestone) =>
						milestoneEntry(
							milestone,
							evidenceRows.filter(
								(evidence) => evidence.milestoneId === milestone.id,
							),
						),
					);
				item.monthlyReports = reportRows
					.filter((report) => report.projectId === item.project.id)
					.map(monthlyReportEntry);
			}
		}

		return c.json({ projects: projects_ });
	}),
);

participationRoutes.get(
	"/my-projects/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);
		if (!profile) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Project not found" } },
				404,
			);
		}

		const [row] = await db
			.select({
				proposal: proposals,
				tender: tenders,
				project: projects,
				companyName: users.name,
			})
			.from(proposals)
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.innerJoin(users, eq(projects.companyId, users.id))
			.where(and(eq(proposals.vendorId, profile.id), eq(projects.id, id)))
			.orderBy(desc(proposals.submittedAt))
			.limit(1);

		if (!row) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Project not found" } },
				404,
			);
		}

		const revisions = await db
			.select()
			.from(proposalRevisions)
			.where(eq(proposalRevisions.proposalId, row.proposal.id))
			.orderBy(proposalRevisions.revisionNumber);

		// Delivery state: milestones with their evidence, plus the MRV reports
		// the vendor filed for this project.
		const milestoneRows = await db
			.select()
			.from(projectMilestones)
			.where(eq(projectMilestones.projectId, row.project.id))
			.orderBy(projectMilestones.stepNumber);

		const milestoneIds = milestoneRows.map((milestone) => milestone.id);
		const evidenceRows = milestoneIds.length
			? await db
					.select()
					.from(milestoneEvidence)
					.where(inArray(milestoneEvidence.milestoneId, milestoneIds))
					.orderBy(milestoneEvidence.uploadedAt)
			: [];

		const reportRows = await db
			.select()
			.from(emissionReports)
			.where(eq(emissionReports.projectId, row.project.id))
			.orderBy(desc(emissionReports.periodStart));

		const detail: VendorMyProjectDetail = {
			id: row.project.id,
			title: row.project.title,
			description: row.project.description,
			status: row.project.status,
			companyName: row.companyName,
			location: row.project.location,
			industrySector: row.project.industrySector,
			budget: row.project.budget,
			tender: tenderSummary(row.tender),
			proposal: {
				id: row.proposal.id,
				amount: row.proposal.amount,
				technicalSpec: row.proposal.technicalSpec,
				operationalCost: row.proposal.operationalCost,
				projectedRoi: row.proposal.projectedRoi,
				warrantyPeriod: row.proposal.warrantyPeriod,
				status: row.proposal.status,
				revisionCount: row.proposal.revisionCount ?? 0,
				submittedAt: iso(row.proposal.submittedAt),
				reviewedAt: iso(row.proposal.reviewedAt),
			},
			revisions: revisions.map(revisionEntry),
			milestones: milestoneRows.map((milestone) =>
				milestoneEntry(
					milestone,
					evidenceRows.filter(
						(evidence) => evidence.milestoneId === milestone.id,
					),
				),
			),
			monthlyReports: reportRows.map(monthlyReportEntry),
		};
		return c.json({ project: detail });
	}),
);

// ── procurement status (proposal-centric pipeline) ────────
participationRoutes.get(
	"/procurement-status",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);
		if (!profile) return c.json({ items: [] });

		const rows = await db
			.select({
				proposal: proposals,
				tender: tenders,
				project: projects,
				companyName: users.name,
				latestNote: sql<
					string | null
				>`(select note from proposal_revisions pr where pr.proposal_id = proposals.id order by pr.id desc limit 1)`,
			})
			.from(proposals)
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.innerJoin(users, eq(projects.companyId, users.id))
			.where(eq(proposals.vendorId, profile.id))
			.orderBy(desc(proposals.submittedAt))
			.limit(limit);

		const items: VendorProcurementStatusItem[] = rows.map(
			({ proposal, tender, project, companyName, latestNote }) => ({
				proposalId: proposal.id,
				proposalStatus: proposal.status,
				revisionCount: proposal.revisionCount ?? 0,
				submittedAt: iso(proposal.submittedAt),
				reviewedAt: iso(proposal.reviewedAt),
				amount: proposal.amount,
				tenderId: tender.id,
				tenderStatus: tender.status,
				tenderDeadlineAt: iso(tender.deadlineAt),
				projectId: project.id,
				projectTitle: project.title,
				companyName,
				latestNote,
			}),
		);
		return c.json({ items });
	}),
);
