import { desc, eq, ne, sql } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { BlueprintSummary, BondListing, BondStatus } from "../contracts";
import { createDb } from "../db";
import { blueprints, investments, projects, users } from "../db/schema";
import type { ApiEnv } from "../env";

const factory = createFactory<ApiEnv>();

export const investorRoutes = new Hono<ApiEnv>();

/**
 * Public bond catalog: every project that is at least in assessment,
 * grouped by whether its blueprint has been published (verified) or is still
 * being processed. Funding totals come from active investments only. No
 * authentication required: this is the landing-adjacent public surface.
 */
investorRoutes.get(
	"/market",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const projectRows = await db
			.select({ project: projects, companyName: users.companyName })
			.from(projects)
			.innerJoin(users, eq(projects.companyId, users.id))
			.where(ne(projects.status, "draft"))
			.orderBy(desc(projects.id));

		// Latest published blueprint per project is the verification signal.
		const publishedBlueprints = await db
			.select({
				projectId: blueprints.projectId,
				document: blueprints.document,
				publishedAt: blueprints.publishedAt,
			})
			.from(blueprints)
			.where(eq(blueprints.status, "published"))
			.orderBy(desc(blueprints.id));

		const blueprintByProject = new Map<
			number,
			(typeof publishedBlueprints)[number]
		>();
		for (const row of publishedBlueprints) {
			if (!blueprintByProject.has(row.projectId)) {
				blueprintByProject.set(row.projectId, row);
			}
		}

		const fundedRows = await db
			.select({
				projectId: investments.projectId,
				funded: sql<number>`coalesce(sum(case when ${investments.status} = 'active' then ${investments.amount} else 0 end), 0)`,
			})
			.from(investments)
			.groupBy(investments.projectId);

		const fundedByProject = new Map(
			fundedRows.map((row) => [row.projectId, row.funded]),
		);

		const bonds: BondListing[] = projectRows.map(({ project, companyName }) => {
			const blueprint = blueprintByProject.get(project.id);
			const funded = fundedByProject.get(project.id) ?? 0;
			const budget = project.budget ?? 0;

			return {
				id: project.id,
				title: project.title,
				bondCode: null,
				companyName,
				industrySector: project.industrySector,
				location: project.location,
				budget: project.budget,
				riskScore: project.riskScore,
				targetEmissionReduction: project.targetEmissionReduction,
				estimatedEnergySaving: project.estimatedEnergySaving,
				funded,
				fundingProgress:
					budget > 0 ? Math.min(Math.max(funded / budget, 0), 1) : 0,
				status: (blueprint ? "verified" : "on_progress") satisfies BondStatus,
				verifiedAt: blueprint?.publishedAt?.toISOString() ?? null,
				blueprint: blueprint
					? blueprintSummary(blueprint.document)
					: emptyBlueprint(),
			};
		});

		return c.json({ bonds });
	}),
);

function emptyBlueprint(): BlueprintSummary {
	return { irr: undefined, npv: undefined, paybackPeriod: undefined };
}

type BlueprintRow = typeof blueprints.$inferSelect;

function blueprintSummary(
	document: BlueprintRow["document"],
): BlueprintSummary {
	return {
		irr: document?.financialProjections?.irr,
		npv: document?.financialProjections?.npv,
		paybackPeriod: document?.financialProjections?.paybackPeriod,
	};
}
