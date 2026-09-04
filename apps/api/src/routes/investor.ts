import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	BlueprintSummary,
	BondSummary,
	BuyBondBody,
	EmissionSummary,
	PortfolioItem,
	RoiPaymentSummary,
} from "../contracts";
import { createDb } from "../db";
import {
	auditLogs,
	blueprints,
	emissionReports,
	investments,
	projects,
	roiPayments,
	users,
} from "../db/schema";
import type { ApiEnv } from "../env";
import { requireRole, requireSession } from "../lib/authz";
import { requireCsrf } from "../lib/csrf";
import { rateLimited, requireJson } from "../lib/http";
import { checkRateLimit, clientIp } from "../lib/rate-limit";

const factory = createFactory<ApiEnv>();

export const investorRoutes = new Hono<ApiEnv>();

// Every investor endpoint requires an investor session.
investorRoutes.use("*", requireSession, requireRole("investor"), requireCsrf);

function blueprintSummary(
	bp: typeof blueprints.$inferSelect,
): BlueprintSummary {
	return {
		irr: bp.document?.financialProjections?.irr,
		npv: bp.document?.financialProjections?.npv,
		paybackPeriod: bp.document?.financialProjections?.paybackPeriod,
	};
}

function bondSummary(inv: typeof investments.$inferSelect): BondSummary {
	return {
		id: inv.id,
		projectId: inv.projectId,
		amount: inv.amount,
		roiPaid: inv.roiPaid ?? 0,
		status: inv.status,
		bondSerialNumber: inv.bondSerialNumber,
		investedAt: inv.investedAt?.toISOString() ?? null,
	};
}

// Green Market: only fundable projects (published blueprint + funding status)
// with active-only funding totals.
investorRoutes.get(
	"/market",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const rows = await db
			.select({
				project: projects,
				companyName: users.companyName,
				blueprint: blueprints,
				funded: sql<number>`coalesce(sum(case when ${investments.status} = 'active' then ${investments.amount} else 0 end), 0)`,
			})
			.from(blueprints)
			.innerJoin(projects, eq(blueprints.projectId, projects.id))
			.innerJoin(users, eq(projects.companyId, users.id))
			.leftJoin(investments, eq(investments.projectId, projects.id))
			.where(
				and(eq(blueprints.status, "published"), eq(projects.status, "funding")),
			)
			.groupBy(projects.id, users.companyName)
			.orderBy(desc(projects.id));

		const market = rows.map(({ project, companyName, blueprint, funded }) => ({
			id: project.id,
			title: project.title,
			companyName,
			industrySector: project.industrySector,
			location: project.location,
			budget: project.budget,
			riskScore: project.riskScore,
			targetEmissionReduction: project.targetEmissionReduction,
			estimatedEnergySaving: project.estimatedEnergySaving,
			funded,
			fundingProgress:
				project.budget && project.budget > 0
					? Math.min(Math.max(funded / project.budget, 0), 1)
					: 0,
			blueprint: blueprintSummary(blueprint),
		}));

		return c.json({ projects: market });
	}),
);

// Buy a bond: creates an investment capped at the project's remaining funds.
investorRoutes.post(
	"/bonds",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<BuyBondBody> | null;
		const projectId = body?.projectId;
		const amount = body?.amount;

		if (
			typeof projectId !== "number" ||
			!Number.isInteger(projectId) ||
			projectId <= 0 ||
			typeof amount !== "number" ||
			!Number.isFinite(amount) ||
			!Number.isInteger(amount) ||
			amount <= 0
		) {
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message: "projectId dan amount wajib valid",
					},
				},
				400,
			);
		}

		const ip = clientIp(c.req.raw);
		const ipCheck = await checkRateLimit(c.env, `bonds:ip:${ip}`, 20, 600);
		if (!ipCheck.ok) return rateLimited(c, ipCheck.retryAfter);
		const userCheck = await checkRateLimit(
			c.env,
			`bonds:user:${c.get("user").id}`,
			20,
			600,
		);
		if (!userCheck.ok) return rateLimited(c, userCheck.retryAfter);

		const db = createDb(c.env.DB);

		const [target] = await db
			.select({ project: projects, blueprint: blueprints })
			.from(blueprints)
			.innerJoin(projects, eq(blueprints.projectId, projects.id))
			.where(
				and(
					eq(projects.id, projectId),
					eq(projects.status, "funding"),
					eq(blueprints.status, "published"),
				),
			)
			.limit(1);

		if (!target) {
			return c.json(
				{
					error: {
						code: "NOT_FUNDABLE",
						message: "Proyek tidak tersedia untuk pendanaan",
					},
				},
				422,
			);
		}

		const [fundedRow] = await db
			.select({
				funded: sql<number>`coalesce(sum(case when ${investments.status} = 'active' then ${investments.amount} else 0 end), 0)`,
			})
			.from(investments)
			.where(eq(investments.projectId, projectId));

		const budget = target.project.budget ?? 0;
		const funded = fundedRow?.funded ?? 0;
		const remaining = budget - funded;
		if (remaining <= 0 || amount > remaining) {
			return c.json(
				{
					error: {
						code: "FUNDING_CAP",
						message: "Jumlah melebihi sisa pendanaan proyek",
					},
				},
				422,
			);
		}

		const serial = `GS-${projectId}-${crypto
			.randomUUID()
			.slice(0, 8)
			.toUpperCase()}`;

		// Sandbox ROI schedule: quarterly payments derived from the
		// blueprint's financial projections (IRR = annual rate, payback
		// period = term), capped at 20 quarters.
		const projections = target.blueprint.document?.financialProjections;
		const rawIrr = projections?.irr;
		const annualRate =
			typeof rawIrr === "number" &&
			Number.isFinite(rawIrr) &&
			rawIrr > 0 &&
			rawIrr <= 100
				? rawIrr
				: 12;
		const rawPayback = projections?.paybackPeriod;
		const paybackYears =
			typeof rawPayback === "number" &&
			Number.isFinite(rawPayback) &&
			rawPayback > 0
				? rawPayback
				: 4;
		const quarters = Math.min(Math.max(Math.round(paybackYears * 4), 1), 20);
		const quarterlyAmount = Math.round((amount * (annualRate / 100)) / 4);

		const start = new Date();
		const schedule = Array.from({ length: quarters }, (_, q) => {
			const due = new Date(
				start.getFullYear(),
				start.getMonth() + (q + 1) * 3,
				1,
			);
			return {
				investmentId: 0, // filled after insert
				amount: quarterlyAmount,
				period: `${due.getFullYear()}-Q${Math.floor(due.getMonth() / 3) + 1}`,
				status: "scheduled" as const,
			};
		});

		const investedAt = new Date();

		// Single atomic statement: the funding cap is re-checked inside the
		// INSERT ... SELECT WHERE, so concurrent buys cannot oversubscribe.
		const runResult = await db.run(sql`
			INSERT INTO investments (project_id, investor_id, amount, roi_paid, status, bond_serial_number, invested_at, created_at)
			SELECT ${projectId}, ${c.get("user").id}, ${amount}, 0, 'active', ${serial}, ${investedAt.getTime()}, ${investedAt.getTime()}
			WHERE EXISTS (
				SELECT 1 FROM projects p
				JOIN blueprints b ON b.project_id = p.id
				WHERE p.id = ${projectId}
					AND p.status = 'funding'
					AND b.status = 'published'
					AND coalesce((SELECT sum(i.amount) FROM investments i WHERE i.project_id = p.id), 0) + ${amount} <= coalesce(p.budget, 0)
			)
			RETURNING id, project_id, amount, roi_paid, status, bond_serial_number, invested_at
		`);

		const row = runResult.results?.[0] as Record<string, unknown> | undefined;
		if (!row) {
			return c.json(
				{
					error: {
						code: "FUNDING_CAP",
						message: "Jumlah melebihi sisa pendanaan proyek",
					},
				},
				422,
			);
		}

		const investment = {
			id: Number(row.id),
			projectId: Number(row.project_id),
			amount: Number(row.amount),
			roiPaid: Number(row.roi_paid ?? 0),
			status: String(row.status),
			bondSerialNumber: String(row.bond_serial_number),
			investedAt: row.invested_at
				? new Date(Number(row.invested_at)).toISOString()
				: null,
		};

		await db.batch([
			db.insert(auditLogs).values({
				userId: c.get("user").id,
				projectId,
				action: "investment.created",
				entityType: "investment",
				entityId: investment.id,
				metadata: { amount, bondSerialNumber: serial },
			}),
			...(quarterlyAmount > 0 && Number.isFinite(quarterlyAmount)
				? [
						db.insert(roiPayments).values(
							schedule.map((s) => ({
								...s,
								investmentId: investment.id,
							})),
						),
					]
				: []),
		]);

		return c.json({ investment }, 201);
	}),
);

// Investor's own portfolio (read-only view).
investorRoutes.get(
	"/portfolio",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const rows = await db
			.select({
				investment: investments,
				project: projects,
				blueprint: blueprints,
			})
			.from(investments)
			.innerJoin(projects, eq(investments.projectId, projects.id))
			.leftJoin(blueprints, eq(blueprints.projectId, projects.id))
			.where(eq(investments.investorId, c.get("user").id))
			.orderBy(desc(investments.investedAt));

		const items: PortfolioItem[] = rows.map(
			({ investment, project, blueprint }) => ({
				investment: bondSummary(investment),
				project: {
					id: project.id,
					title: project.title,
					status: project.status,
					industrySector: project.industrySector,
					location: project.location,
					targetEmissionReduction: project.targetEmissionReduction,
					estimatedEnergySaving: project.estimatedEnergySaving,
				},
				blueprint: blueprint ? blueprintSummary(blueprint) : {},
			}),
		);

		return c.json({ items });
	}),
);

// Single investment detail: ROI schedule + emission progress (owner-scoped).
investorRoutes.get(
	"/portfolio/:id",
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
				investment: investments,
				project: projects,
				blueprint: blueprints,
			})
			.from(investments)
			.innerJoin(projects, eq(investments.projectId, projects.id))
			.leftJoin(blueprints, eq(blueprints.projectId, projects.id))
			.where(
				and(
					eq(investments.id, id),
					eq(investments.investorId, c.get("user").id),
				),
			)
			.limit(1);

		if (!row) {
			return c.json(
				{
					error: {
						code: "NOT_FOUND",
						message: "Investasi tidak ditemukan",
					},
				},
				404,
			);
		}

		const payments = await db
			.select()
			.from(roiPayments)
			.where(eq(roiPayments.investmentId, id))
			.orderBy(roiPayments.period);

		const reports = await db
			.select()
			.from(emissionReports)
			.where(eq(emissionReports.projectId, row.project.id))
			.orderBy(desc(emissionReports.periodEnd));

		const paymentSummaries: RoiPaymentSummary[] = payments.map((payment) => ({
			id: payment.id,
			amount: payment.amount,
			period: payment.period,
			status: payment.status,
			escrowTxId: payment.escrowTxId,
			paidAt: payment.paidAt?.toISOString() ?? null,
		}));

		const reportSummaries: EmissionSummary[] = reports.map((report) => ({
			id: report.id,
			periodStart: report.periodStart?.toISOString() ?? null,
			periodEnd: report.periodEnd?.toISOString() ?? null,
			emissionReduction: report.emissionReduction,
			actualConsumption: report.actualConsumption,
			baselineConsumption: report.baselineConsumption,
			anomalyFlagged: report.anomalyFlagged,
		}));

		return c.json({
			investment: bondSummary(row.investment),
			project: {
				id: row.project.id,
				title: row.project.title,
				status: row.project.status,
				industrySector: row.project.industrySector,
				location: row.project.location,
				targetEmissionReduction: row.project.targetEmissionReduction,
				estimatedEnergySaving: row.project.estimatedEnergySaving,
			},
			blueprint: row.blueprint ? blueprintSummary(row.blueprint) : {},
			payments: paymentSummaries,
			emissionReports: reportSummaries,
		});
	}),
);
