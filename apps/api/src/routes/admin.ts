import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	AdminBlueprint,
	AdminInvestment,
	AdminProject,
	AdminRoiPayment,
	AdminStats,
	AdminUser,
	AuditLogEntry,
	BlueprintUpdateBody,
	UpdateStatusBody,
	VerifyUserBody,
} from "../contracts";
import { createDb } from "../db";
import {
	auditLogs,
	blueprints,
	investments,
	projectStatuses,
	projects,
	roiPayments,
	userRoles,
	users,
} from "../db/schema";
import type { ApiEnv } from "../env";
import { requireRole, requireSession } from "../lib/authz";
import { requireJson } from "../lib/http";

const factory = createFactory<ApiEnv>();

export const adminRoutes = new Hono<ApiEnv>();

// Every admin endpoint requires an admin session.
adminRoutes.use("*", requireSession, requireRole("admin"));

const blueprintStatuses = [
	"draft",
	"audit",
	"validated",
	"rejected",
	"published",
] as const;
const blueprintTransitions: Record<string, readonly string[]> = {
	draft: ["audit"],
	audit: ["validated", "rejected"],
	validated: ["published"],
	rejected: ["audit"],
	published: [],
};

function isPublishableDocument(
	document: typeof blueprints.$inferSelect.document,
): boolean {
	const projections = document?.financialProjections;
	return (
		typeof projections?.irr === "number" &&
		Number.isFinite(projections.irr) &&
		projections.irr > 0 &&
		projections.irr <= 100 &&
		typeof projections?.paybackPeriod === "number" &&
		Number.isFinite(projections.paybackPeriod) &&
		projections.paybackPeriod > 0
	);
}

function iso(date: Date | null): string | null {
	return date?.toISOString() ?? null;
}

function parseLimit(raw: string | undefined, fallback = 50, max = 200) {
	const n = Number(raw ?? fallback);
	return Math.min(
		Math.max(Number.isFinite(n) ? Math.trunc(n) : fallback, 1),
		max,
	);
}

// ── users ────────────────────────────────────────────────
adminRoutes.get(
	"/users",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const role = c.req.query("role");
		if (role && !(userRoles as readonly string[]).includes(role)) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Role tidak valid" } },
				400,
			);
		}
		const limit = parseLimit(c.req.query("limit"));

		const query = db.select().from(users).$dynamic();
		if (role) {
			query.where(eq(users.role, role as (typeof userRoles)[number]));
		}
		query.orderBy(desc(users.id)).limit(limit);
		const rows = await query;

		const list: AdminUser[] = rows.map((user) => ({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			companyName: user.companyName,
			verifiedAt: iso(user.verifiedAt),
			createdAt: iso(user.createdAt),
		}));
		return c.json({ users: list });
	}),
);

adminRoutes.patch(
	"/users/:id/verify",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<VerifyUserBody> | null;
		if (
			!Number.isInteger(id) ||
			id <= 0 ||
			typeof body?.verified !== "boolean"
		) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Input tidak valid" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const [user] = await db
			.select({ id: users.id, role: users.role, verifiedAt: users.verifiedAt })
			.from(users)
			.where(eq(users.id, id))
			.limit(1);
		if (!user) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Pengguna tidak ditemukan" } },
				404,
			);
		}
		if (user.role === "admin" && body.verified === false) {
			return c.json(
				{
					error: {
						code: "FORBIDDEN",
						message: "Akun admin tidak dapat dideverifikasi",
					},
				},
				403,
			);
		}

		await db.batch([
			db
				.update(users)
				.set({ verifiedAt: body.verified ? new Date() : null })
				.where(eq(users.id, id)),
			db.insert(auditLogs).values({
				userId: c.get("user").id,
				action: "user.verified",
				entityType: "user",
				entityId: id,
				metadata: {
					from: iso(user.verifiedAt),
					to: body.verified ? "verified" : null,
				},
			}),
		]);
		return c.json({ ok: true });
	}),
);

// ── projects ─────────────────────────────────────────────
adminRoutes.get(
	"/projects",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const status = c.req.query("status");
		if (status && !(projectStatuses as readonly string[]).includes(status)) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Status tidak valid" } },
				400,
			);
		}
		const limit = parseLimit(c.req.query("limit"));

		const query = db
			.select({
				project: projects,
				companyName: users.name,
				blueprintStatus: blueprints.status,
			})
			.from(projects)
			.innerJoin(users, eq(projects.companyId, users.id))
			.leftJoin(blueprints, eq(blueprints.projectId, projects.id))
			.$dynamic();
		if (status) {
			query.where(
				eq(projects.status, status as (typeof projectStatuses)[number]),
			);
		}
		query.orderBy(desc(projects.id)).limit(limit);
		const rows = await query;

		const list: AdminProject[] = rows.map(
			({ project, companyName, blueprintStatus }) => ({
				id: project.id,
				title: project.title,
				status: project.status,
				companyName,
				industrySector: project.industrySector,
				budget: project.budget,
				riskScore: project.riskScore,
				blueprintStatus,
			}),
		);
		return c.json({ projects: list });
	}),
);

adminRoutes.patch(
	"/projects/:id/status",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<UpdateStatusBody> | null;
		const status = body?.status;
		if (
			!Number.isInteger(id) ||
			id <= 0 ||
			typeof status !== "string" ||
			!(projectStatuses as readonly string[]).includes(status)
		) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Input tidak valid" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const [project] = await db
			.select({ id: projects.id, status: projects.status })
			.from(projects)
			.where(eq(projects.id, id))
			.limit(1);
		if (!project) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Proyek tidak ditemukan" } },
				404,
			);
		}

		await db.batch([
			db
				.update(projects)
				.set({
					status: status as (typeof projectStatuses)[number],
					completedAt: status === "completed" ? new Date() : undefined,
				})
				.where(eq(projects.id, id)),
			db.insert(auditLogs).values({
				userId: c.get("user").id,
				action: "project.status_changed",
				entityType: "project",
				entityId: id,
				projectId: id,
				metadata: { from: project.status, to: status },
			}),
		]);
		return c.json({ ok: true });
	}),
);

// ── blueprints (auditor gatekeeper workflow) ─────────────
adminRoutes.get(
	"/blueprints",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const status = c.req.query("status");
		if (status && !(blueprintStatuses as readonly string[]).includes(status)) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Status tidak valid" } },
				400,
			);
		}
		const limit = parseLimit(c.req.query("limit"));

		const query = db
			.select({ blueprint: blueprints, projectTitle: projects.title })
			.from(blueprints)
			.innerJoin(projects, eq(blueprints.projectId, projects.id))
			.$dynamic();
		if (status) query.where(eq(blueprints.status, status));
		query.orderBy(desc(blueprints.id)).limit(limit);
		const rows = await query;

		const list: AdminBlueprint[] = rows.map(({ blueprint, projectTitle }) => ({
			id: blueprint.id,
			projectId: blueprint.projectId,
			projectTitle,
			status: blueprint.status,
			auditNote: blueprint.auditNote,
			validatedAt: iso(blueprint.validatedAt),
			publishedAt: iso(blueprint.publishedAt),
		}));
		return c.json({ blueprints: list });
	}),
);

adminRoutes.patch(
	"/blueprints/:id",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<BlueprintUpdateBody> | null;
		const status = body?.status;
		if (
			!Number.isInteger(id) ||
			id <= 0 ||
			typeof status !== "string" ||
			!(blueprintStatuses as readonly string[]).includes(status)
		) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Input tidak valid" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const [blueprint] = await db
			.select()
			.from(blueprints)
			.where(eq(blueprints.id, id))
			.limit(1);
		if (!blueprint) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Blueprint tidak ditemukan" } },
				404,
			);
		}

		const allowed = blueprintTransitions[blueprint.status] ?? [];
		if (!allowed.includes(status)) {
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message: "Transisi status tidak valid",
					},
				},
				422,
			);
		}
		if (status === "published" && !isPublishableDocument(blueprint.document)) {
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message: "Blueprint belum lengkap untuk dipublikasikan",
					},
				},
				422,
			);
		}

		await db.batch([
			db
				.update(blueprints)
				.set({
					status,
					auditNote:
						typeof body?.auditNote === "string"
							? body.auditNote
							: blueprint.auditNote,
					auditorId:
						status === "validated" || status === "published"
							? c.get("user").id
							: blueprint.auditorId,
					validatedAt:
						status === "validated" ? new Date() : blueprint.validatedAt,
					publishedAt:
						status === "published" ? new Date() : blueprint.publishedAt,
				})
				.where(eq(blueprints.id, id)),
			db.insert(auditLogs).values({
				userId: c.get("user").id,
				action: "blueprint.status_changed",
				entityType: "blueprint",
				entityId: id,
				projectId: blueprint.projectId,
				metadata: {
					from: blueprint.status,
					to: status,
					auditNote:
						typeof body?.auditNote === "string"
							? body.auditNote
							: blueprint.auditNote,
					auditorId:
						status === "validated" || status === "published"
							? c.get("user").id
							: blueprint.auditorId,
				},
			}),
		]);

		if (status === "published") {
			const [project] = await db
				.select({ id: projects.id, status: projects.status })
				.from(projects)
				.where(eq(projects.id, blueprint.projectId))
				.limit(1);
			const preFunding = ["draft", "assessment", "tendering", "blueprint"];
			if (project && preFunding.includes(project.status)) {
				await db
					.update(projects)
					.set({ status: "funding" })
					.where(eq(projects.id, project.id));
			}
		}

		return c.json({ ok: true });
	}),
);

// ── investments & ROI payments ───────────────────────────
adminRoutes.get(
	"/investments",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const status = c.req.query("status");
		const validStatuses = ["active", "completed", "defaulted"];
		const limit = parseLimit(c.req.query("limit"));

		const query = db
			.select({
				investment: investments,
				investor: users,
				projectTitle: projects.title,
			})
			.from(investments)
			.innerJoin(users, eq(investments.investorId, users.id))
			.innerJoin(projects, eq(investments.projectId, projects.id))
			.$dynamic();
		if (status) {
			if (!validStatuses.includes(status)) {
				return c.json(
					{ error: { code: "VALIDATION", message: "Status tidak valid" } },
					400,
				);
			}
			query.where(eq(investments.status, status));
		}
		query.orderBy(desc(investments.investedAt)).limit(limit);
		const rows = await query;

		const list: AdminInvestment[] = rows.map(
			({ investment, investor, projectTitle }) => ({
				id: investment.id,
				investorName: investor.name,
				investorEmail: investor.email,
				projectTitle,
				amount: investment.amount,
				roiPaid: investment.roiPaid ?? 0,
				status: investment.status,
				bondSerialNumber: investment.bondSerialNumber,
				investedAt: iso(investment.investedAt),
			}),
		);
		return c.json({ investments: list });
	}),
);

adminRoutes.get(
	"/roi-payments",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const status = c.req.query("status");
		const validStatuses = ["scheduled", "paid", "failed"];
		const limit = parseLimit(c.req.query("limit"));

		const query = db
			.select({
				payment: roiPayments,
				investmentId: investments.id,
				investorEmail: users.email,
				projectTitle: projects.title,
			})
			.from(roiPayments)
			.innerJoin(investments, eq(roiPayments.investmentId, investments.id))
			.innerJoin(users, eq(investments.investorId, users.id))
			.innerJoin(projects, eq(investments.projectId, projects.id))
			.$dynamic();
		if (status) {
			if (!validStatuses.includes(status)) {
				return c.json(
					{ error: { code: "VALIDATION", message: "Status tidak valid" } },
					400,
				);
			}
			query.where(eq(roiPayments.status, status));
		}
		query.orderBy(desc(roiPayments.period)).limit(limit);
		const rows = await query;

		const list: AdminRoiPayment[] = rows.map(
			({ payment, investmentId, investorEmail, projectTitle }) => ({
				id: payment.id,
				investmentId,
				investorEmail,
				projectTitle,
				period: payment.period,
				amount: payment.amount,
				status: payment.status,
				escrowTxId: payment.escrowTxId,
				paidAt: iso(payment.paidAt),
			}),
		);
		return c.json({ payments: list });
	}),
);

// Sandbox escrow payout: marks a scheduled payment paid and credits the
// investment's roiPaid. No real money moves (MVP simulation).
adminRoutes.post(
	"/roi-payments/:id/payout",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "ID tidak valid" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const [payment] = await db
			.select()
			.from(roiPayments)
			.where(eq(roiPayments.id, id))
			.limit(1);
		if (!payment) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Pembayaran tidak ditemukan" } },
				404,
			);
		}
		if (payment.status !== "scheduled") {
			return c.json(
				{
					error: {
						code: "ALREADY_PAID",
						message: "Pembayaran sudah diproses",
					},
				},
				409,
			);
		}

		const escrowBytes = crypto.getRandomValues(new Uint8Array(8));
		const escrowTxId = `ESC-${payment.id}-${Array.from(escrowBytes, (b) =>
			b.toString(16).padStart(2, "0"),
		)
			.join("")
			.toUpperCase()}`;

		const [paid] = await db
			.update(roiPayments)
			.set({ status: "paid", escrowTxId, paidAt: new Date() })
			.where(and(eq(roiPayments.id, id), eq(roiPayments.status, "scheduled")))
			.returning();

		if (!paid) {
			return c.json(
				{
					error: {
						code: "ALREADY_PAID",
						message: "Pembayaran sudah diproses",
					},
				},
				409,
			);
		}

		await db.batch([
			db
				.update(investments)
				.set({
					roiPaid: sql`${investments.roiPaid} + ${payment.amount}`,
				})
				.where(eq(investments.id, payment.investmentId)),
			db.insert(auditLogs).values({
				userId: c.get("user").id,
				action: "roi.payment_paid",
				entityType: "roi_payment",
				entityId: id,
				metadata: {
					escrowTxId,
					amount: payment.amount,
					period: payment.period,
				},
			}),
		]);

		return c.json({ ok: true, escrowTxId });
	}),
);

// ── audit trail & stats ──────────────────────────────────
adminRoutes.get(
	"/audit-logs",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const rows = await db
			.select({ log: auditLogs, userEmail: users.email })
			.from(auditLogs)
			.leftJoin(users, eq(auditLogs.userId, users.id))
			.orderBy(desc(auditLogs.createdAt))
			.limit(limit);

		const list: AuditLogEntry[] = rows.map(({ log, userEmail }) => ({
			id: log.id,
			action: log.action,
			entityType: log.entityType,
			entityId: log.entityId,
			metadata: log.metadata,
			createdAt: iso(log.createdAt),
			userEmail,
		}));
		return c.json({ logs: list });
	}),
);

adminRoutes.get(
	"/stats",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const [usersByRole, projectsByStatus, investmentAgg, paymentsByStatus] =
			await Promise.all([
				db
					.select({ role: users.role, count: sql<number>`count(*)` })
					.from(users)
					.groupBy(users.role),
				db
					.select({ status: projects.status, count: sql<number>`count(*)` })
					.from(projects)
					.groupBy(projects.status),
				db
					.select({
						total: sql<number>`count(*)`,
						sum: sql<number>`coalesce(sum(${investments.amount}), 0)`,
						roiPaid: sql<number>`coalesce(sum(${investments.roiPaid}), 0)`,
					})
					.from(investments),
				db
					.select({ status: roiPayments.status, count: sql<number>`count(*)` })
					.from(roiPayments)
					.groupBy(roiPayments.status),
			]);

		const toRecord = (
			rows: { role?: string; status?: string; count: number }[],
		) =>
			rows.reduce<Record<string, number>>((acc, row) => {
				acc[(row.role ?? row.status) as string] = row.count;
				return acc;
			}, {});

		const stats: AdminStats = {
			users: toRecord(usersByRole),
			projects: toRecord(projectsByStatus),
			investments: {
				total: investmentAgg[0]?.total ?? 0,
				sum: investmentAgg[0]?.sum ?? 0,
				roiPaid: investmentAgg[0]?.roiPaid ?? 0,
			},
			payments: toRecord(paymentsByStatus),
		};
		return c.json(stats);
	}),
);
