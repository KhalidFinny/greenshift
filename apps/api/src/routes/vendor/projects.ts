import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	VendorProjectDetail,
	VendorProjectListItem,
} from "../../contracts";
import { createDb } from "../../db";
import {
	blueprints,
	projects,
	proposals,
	tenders,
	users,
	vendors,
} from "../../db/schema";
import type { ApiEnv } from "../../env";
import { parseLimit, tenderSummary } from "./helpers";

const factory = createFactory<ApiEnv>();

export const projectsRoutes = new Hono<ApiEnv>();

// ── projects (procurement market) ─────────────────────────
// Every project that currently has a tender, open tenders first.
projectsRoutes.get(
	"/projects",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const tenderStatus = c.req.query("status");
		if (
			tenderStatus &&
			!["open", "evaluation", "closed", "awarded"].includes(tenderStatus)
		) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Status tender tidak valid" } },
				400,
			);
		}
		const limit = parseLimit(c.req.query("limit"));

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);

		const query = db
			.select({
				project: projects,
				companyName: users.name,
				tender: tenders,
				myProposalId: proposals.id,
			})
			.from(tenders)
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.innerJoin(users, eq(projects.companyId, users.id))
			.leftJoin(
				proposals,
				and(
					eq(proposals.tenderId, tenders.id),
					eq(proposals.vendorId, profile?.id ?? -1),
				),
			)
			.$dynamic();
		if (tenderStatus) {
			query.where(eq(tenders.status, tenderStatus));
		}
		query
			.orderBy(
				sql`case when ${tenders.status} = 'open' then 0 else 1 end`,
				asc(tenders.deadlineAt),
				asc(tenders.id),
			)
			.limit(limit);

		const rows = await query;
		const list: VendorProjectListItem[] = rows.map(
			({ project, companyName, tender, myProposalId }) => ({
				id: project.id,
				title: project.title,
				companyName,
				industrySector: project.industrySector,
				location: project.location,
				budget: project.budget,
				status: project.status,
				tender: tenderSummary(tender),
				myProposalId,
			}),
		);
		return c.json({ projects: list });
	}),
);

projectsRoutes.get(
	"/projects/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "ID tidak valid" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const [row] = await db
			.select({
				project: projects,
				companyName: users.name,
				tender: tenders,
				blueprint: blueprints,
			})
			.from(projects)
			.innerJoin(users, eq(projects.companyId, users.id))
			.leftJoin(tenders, eq(tenders.projectId, projects.id))
			.leftJoin(blueprints, eq(blueprints.projectId, projects.id))
			.where(eq(projects.id, id))
			.orderBy(desc(blueprints.id))
			.limit(1);

		if (!row) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Proyek tidak ditemukan" } },
				404,
			);
		}

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);

		let canSubmit = false;
		if (profile && row.tender) {
			const [existing] = await db
				.select({ id: proposals.id })
				.from(proposals)
				.where(
					and(
						eq(proposals.tenderId, row.tender.id),
						eq(proposals.vendorId, profile.id),
					),
				)
				.limit(1);
			canSubmit =
				row.tender.status === "open" &&
				(!row.tender.deadlineAt ||
					row.tender.deadlineAt.getTime() > Date.now()) &&
				!existing;
		}

		// Blueprint financials and the risk composite are confidential until
		// published to the market (investors only see them post-publication).
		const published = row.blueprint?.status === "published";
		const bp = published ? row.blueprint : null;
		const detail: VendorProjectDetail = {
			id: row.project.id,
			title: row.project.title,
			description: row.project.description,
			companyName: row.companyName,
			industrySector: row.project.industrySector,
			location: row.project.location,
			budget: row.project.budget,
			status: row.project.status,
			targetEmissionReduction: row.project.targetEmissionReduction,
			estimatedEnergySaving: row.project.estimatedEnergySaving,
			riskScore: published ? row.project.riskScore : null,
			tender: row.tender ? tenderSummary(row.tender) : null,
			blueprint: {
				irr: bp?.document?.financialProjections?.irr,
				npv: bp?.document?.financialProjections?.npv,
				paybackPeriod: bp?.document?.financialProjections?.paybackPeriod,
			},
			canSubmit,
		};
		return c.json({ project: detail });
	}),
);
