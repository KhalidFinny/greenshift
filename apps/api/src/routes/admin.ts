import {
	and,
	desc,
	eq,
	inArray,
	isNotNull,
	isNull,
	lt,
	notLike,
	or,
	sql,
} from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	AdminAnomaly,
	AdminBlueprint,
	AdminInvestment,
	AdminProject,
	AdminRoiPayment,
	AdminStats,
	AdminUser,
	AdminVendor,
	AuditLogEntry,
	BlueprintUpdateBody,
	UpdateStatusBody,
	VerifyUserBody,
	VerifyVendorBody,
} from "../contracts";
import { createDb } from "../db";
import {
	auditLogs,
	blueprints,
	emissionReports,
	investments,
	projectStatuses,
	projects,
	proposals,
	roiPayments,
	tenders,
	userRoles,
	users,
	vendors,
} from "../db/schema";
import type { ApiEnv } from "../env";
import { requireRecentStepUp, requireRole, requireSession } from "../lib/authz";
import { requireCsrf } from "../lib/csrf";
import { requireJson } from "../lib/http";

const factory = createFactory<ApiEnv>();

export const adminRoutes = new Hono<ApiEnv>();

// Every admin endpoint requires an admin session. CSRF is enforced only for
// unsafe methods inside the middleware.
adminRoutes.use("*", requireSession, requireRole("admin"), requireCsrf);

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

		const query = db
			.select({ user: users, vendorId: vendors.id })
			.from(users)
			.leftJoin(vendors, eq(vendors.userId, users.id))
			.$dynamic();
		if (role) {
			query.where(eq(users.role, role as (typeof userRoles)[number]));
		}
		query.orderBy(desc(users.id)).limit(limit);
		const rows = await query;

		const list: AdminUser[] = rows.map(({ user, vendorId }) => ({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			companyName: user.companyName,
			verifiedAt: iso(user.verifiedAt),
			vendorProfile: vendorId !== null,
			createdAt: iso(user.createdAt),
		}));
		return c.json({ users: list });
	}),
);

adminRoutes.patch(
	"/users/:id/verify",
	requireRecentStepUp,
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
	requireRecentStepUp,
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
	requireRecentStepUp,
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
	requireRecentStepUp,
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

		const [
			verificationAgg,
			companiesAgg,
			investorsAgg,
			blueprintsByStatus,
			fundingRows,
		] = await Promise.all([
			db
				.select({
					verified: sql<number>`coalesce(sum(case when ${users.verifiedAt} is not null then 1 else 0 end), 0)`,
					unverified: sql<number>`coalesce(sum(case when ${users.verifiedAt} is null then 1 else 0 end), 0)`,
				})
				.from(users),
			db
				.select({ count: sql<number>`count(distinct ${users.companyName})` })
				.from(users)
				.where(isNotNull(users.companyName)),
			db
				.select({
					count: sql<number>`count(distinct ${investments.investorId})`,
				})
				.from(investments),
			db
				.select({ status: blueprints.status, count: sql<number>`count(*)` })
				.from(blueprints)
				.groupBy(blueprints.status),
			db
				.select({
					id: projects.id,
					title: projects.title,
					budget: projects.budget,
					funded: sql<number>`coalesce(sum(${investments.amount}), 0)`,
				})
				.from(projects)
				.leftJoin(investments, eq(investments.projectId, projects.id))
				.groupBy(projects.id, projects.title, projects.budget)
				.orderBy(desc(sql`coalesce(sum(${investments.amount}), 0)`))
				.limit(5),
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
			usersVerified: {
				verified: verificationAgg[0]?.verified ?? 0,
				unverified: verificationAgg[0]?.unverified ?? 0,
			},
			companies: companiesAgg[0]?.count ?? 0,
			investorsActive: investorsAgg[0]?.count ?? 0,
			blueprints: toRecord(blueprintsByStatus),
			funding: fundingRows.map((row) => ({
				id: row.id,
				title: row.title,
				budget: row.budget,
				funded: row.funded,
				progress: row.budget ? Math.min(row.funded / row.budget, 1) : 0,
			})),
		};
		return c.json(stats);
	}),
);

// ── vendors (certification & portfolio verification) ─────
adminRoutes.get(
	"/vendors",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const limit = parseLimit(c.req.query("limit"));

		const rows = await db
			.select({
				vendor: vendors,
				user: users,
			})
			.from(vendors)
			.innerJoin(users, eq(vendors.userId, users.id))
			.orderBy(desc(vendors.createdAt))
			.limit(limit);

		const list: AdminVendor[] = rows.map(({ vendor, user }) => ({
			id: vendor.id,
			userId: vendor.userId,
			email: user.email,
			userName: user.name,
			companyName: vendor.companyName,
			description: vendor.description,
			certifications: (vendor.certifications as string[]) ?? [],
			portfolio: (vendor.portfolio as string[]) ?? [],
			rating: vendor.rating ?? 0,
			totalProjects: vendor.totalProjects ?? 0,
			verifiedAt: iso(vendor.verifiedAt),
			createdAt: iso(vendor.createdAt),
		}));
		return c.json({ vendors: list });
	}),
);

adminRoutes.patch(
	"/vendors/:id/verify",
	requireRecentStepUp,
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const id = Number(c.req.param("id"));
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<VerifyVendorBody> | null;
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
		const [vendor] = await db
			.select({ id: vendors.id, verifiedAt: vendors.verifiedAt })
			.from(vendors)
			.where(eq(vendors.id, id))
			.limit(1);
		if (!vendor) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Vendor tidak ditemukan" } },
				404,
			);
		}

		await db.batch([
			db
				.update(vendors)
				.set({ verifiedAt: body.verified ? new Date() : null })
				.where(eq(vendors.id, id)),
			db.insert(auditLogs).values({
				userId: c.get("user").id,
				action: "vendor.verified",
				entityType: "vendor_profile",
				entityId: id,
				metadata: {
					from: iso(vendor.verifiedAt),
					to: body.verified ? "verified" : null,
				},
			}),
		]);
		return c.json({ ok: true });
	}),
);

// ── monitoring: red flags (read-only rule engine) ────────
// Surfaces rule breaches and anomalies across the database for platform
// oversight. Read-only: admin monitors, never mutates operational state.
const SEVERITY_RANK: Record<AdminAnomaly["severity"], number> = {
	critical: 0,
	high: 1,
	medium: 2,
	low: 3,
};

adminRoutes.get(
	"/anomalies",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const flags: AdminAnomaly[] = [];

		const push = (
			category: string,
			kind: string,
			severity: AdminAnomaly["severity"],
			title: string,
			detail: string,
			entityType: string | null,
			entityId: number | null,
			entityLabel: string | null,
			createdAt: Date | null,
		) => {
			flags.push({
				id: `${category}.${kind}-${entityId ?? flags.length}`,
				category,
				severity,
				title,
				detail,
				entityType,
				entityId,
				entityLabel,
				createdAt: iso(createdAt),
			});
		};

		// Blueprint published without a validation trail (governance breach)
		const rogueBlueprints = await db
			.select({
				blueprint: blueprints,
				projectTitle: projects.title,
			})
			.from(blueprints)
			.innerJoin(projects, eq(blueprints.projectId, projects.id))
			.where(
				and(
					eq(blueprints.status, "published"),
					or(isNull(blueprints.validatedAt), isNull(blueprints.auditorId)),
				),
			)
			.limit(50);
		for (const { blueprint, projectTitle } of rogueBlueprints) {
			push(
				"blueprint",
				"published_invalid",
				"critical",
				"Blueprint dipublikasikan tanpa validasi",
				`Blueprint proyek "${projectTitle}" berstatus published tanpa jejak validasi auditor.`,
				"blueprint",
				blueprint.id,
				projectTitle,
				blueprint.publishedAt,
			);
		}

		// MRV anomaly: actual consumption deviates from promised savings
		const emissionFlags = await db
			.select({
				report: emissionReports,
				projectTitle: projects.title,
			})
			.from(emissionReports)
			.innerJoin(projects, eq(emissionReports.projectId, projects.id))
			.where(eq(emissionReports.anomalyFlagged, true))
			.orderBy(desc(emissionReports.createdAt))
			.limit(100);
		for (const { report, projectTitle } of emissionFlags) {
			push(
				"emission",
				"anomaly",
				"high",
				"Anomali laporan emisi terdeteksi",
				report.anomalyNote ??
					`Konsumsi aktual menyimpang dari baseline (skor ${report.anomalyScore ?? "?"}).`,
				"emission_report",
				report.id,
				projectTitle,
				report.createdAt,
			);
		}

		// Payout integrity: failed payments, paid without escrow reference,
		// or the same escrow transaction used twice
		const failedPayments = await db
			.select({
				payment: roiPayments,
				investorEmail: users.email,
				projectTitle: projects.title,
			})
			.from(roiPayments)
			.innerJoin(investments, eq(roiPayments.investmentId, investments.id))
			.innerJoin(users, eq(investments.investorId, users.id))
			.innerJoin(projects, eq(investments.projectId, projects.id))
			.where(eq(roiPayments.status, "failed"))
			.orderBy(desc(roiPayments.createdAt))
			.limit(100);
		for (const { payment, investorEmail, projectTitle } of failedPayments) {
			push(
				"payout",
				"failed",
				"high",
				"Pembayaran ROI gagal",
				`Pembayaran ${projectTitle} untuk ${investorEmail} berstatus failed.`,
				"roi_payment",
				payment.id,
				investorEmail,
				payment.createdAt,
			);
		}

		const paidPayments = await db
			.select()
			.from(roiPayments)
			.where(isNotNull(roiPayments.escrowTxId))
			.orderBy(desc(roiPayments.createdAt))
			.limit(500);
		const seenTx = new Map<string, (typeof paidPayments)[number]>();
		for (const payment of paidPayments) {
			if (payment.status !== "paid") continue;
			if (!payment.escrowTxId) {
				push(
					"payout",
					"no_tx",
					"high",
					"Pembayaran tanpa referensi escrow",
					`Pembayaran ROI ${payment.period ?? `#${payment.id}`} berstatus paid tanpa escrowTxId.`,
					"roi_payment",
					payment.id,
					null,
					payment.paidAt,
				);
				continue;
			}
			const seen = seenTx.get(payment.escrowTxId);
			if (seen) {
				push(
					"payout",
					"dup_tx",
					"high",
					"Transaksi escrow digunakan dua kali",
					`${payment.escrowTxId} dipakai oleh pembayaran #${seen.id} dan #${payment.id}.`,
					"roi_payment",
					payment.id,
					payment.escrowTxId,
					payment.paidAt,
				);
			} else {
				seenTx.set(payment.escrowTxId, payment);
			}
		}

		// Funding integrity: investments exceeding the project budget
		const overfunded = await db
			.select({
				projectId: projects.id,
				projectTitle: projects.title,
				budget: projects.budget,
				funded: sql<number>`coalesce(sum(${investments.amount}), 0)`,
			})
			.from(investments)
			.innerJoin(projects, eq(investments.projectId, projects.id))
			.where(isNotNull(projects.budget))
			.groupBy(projects.id, projects.title, projects.budget)
			.having(sql`sum(${investments.amount}) > ${projects.budget}`)
			.limit(50);
		for (const row of overfunded) {
			push(
				"funding",
				"overcap",
				"high",
				"Pendanaan melebihi anggaran",
				`Proyek "${row.projectTitle}" terdanai ${row.funded.toLocaleString("id-ID")} dari anggaran ${row.budget?.toLocaleString("id-ID")}.`,
				"project",
				row.projectId,
				row.projectTitle,
				null,
			);
		}

		// Bond serials not matching the GS-* convention
		const badSerials = await db
			.select({
				investment: investments,
				investorEmail: users.email,
				projectTitle: projects.title,
			})
			.from(investments)
			.innerJoin(users, eq(investments.investorId, users.id))
			.innerJoin(projects, eq(investments.projectId, projects.id))
			.where(
				and(
					isNotNull(investments.bondSerialNumber),
					notLike(investments.bondSerialNumber, "GS-%"),
				),
			)
			.limit(100);
		for (const { investment, investorEmail, projectTitle } of badSerials) {
			push(
				"bond",
				"bad_serial",
				"low",
				"Nomor seri obligasi tidak sesuai format",
				`Obligasi ${investment.bondSerialNumber} (${investorEmail}, ${projectTitle}) di luar format GS-*.`,
				"investment",
				investment.id,
				investment.bondSerialNumber,
				investment.investedAt,
			);
		}

		// Proposal revision limit breached (max 3 revisions)
		const overRevised = await db
			.select({
				proposal: proposals,
				projectTitle: projects.title,
			})
			.from(proposals)
			.innerJoin(tenders, eq(proposals.tenderId, tenders.id))
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.where(sql`${proposals.revisionCount} >= 3`)
			.orderBy(desc(proposals.updatedAt))
			.limit(100);
		for (const { proposal, projectTitle } of overRevised) {
			push(
				"proposal",
				"revision_limit",
				"medium",
				"Proposal melewati batas revisi",
				`Proposal ${projectTitle} mencapai ${proposal.revisionCount} revisi (batas 3).`,
				"proposal",
				proposal.id,
				projectTitle,
				proposal.updatedAt,
			);
		}

		// Tenders still open past their deadline
		const staleTenders = await db
			.select({
				tender: tenders,
				projectTitle: projects.title,
			})
			.from(tenders)
			.innerJoin(projects, eq(tenders.projectId, projects.id))
			.where(
				and(
					eq(tenders.status, "open"),
					isNotNull(tenders.deadlineAt),
					lt(tenders.deadlineAt, new Date()),
				),
			)
			.orderBy(desc(tenders.deadlineAt))
			.limit(100);
		for (const { tender, projectTitle } of staleTenders) {
			push(
				"tender",
				"stale",
				"medium",
				"Tender melewati tenggat",
				`Tender ${projectTitle} masih open setelah tenggat ${iso(tender.deadlineAt)?.slice(0, 10)}.`,
				"tender",
				tender.id,
				projectTitle,
				tender.deadlineAt,
			);
		}

		// Accounts: business/vendor operating unverified
		const unverifiedUsers = await db
			.select()
			.from(users)
			.where(
				and(
					inArray(users.role, ["business", "vendor"]),
					isNull(users.verifiedAt),
				),
			)
			.orderBy(desc(users.createdAt))
			.limit(100);
		for (const user of unverifiedUsers) {
			push(
				"user",
				"unverified",
				"medium",
				"Akun belum diverifikasi",
				`Akun ${user.role} ${user.email} aktif tanpa verifikasi.`,
				"user",
				user.id,
				user.email,
				user.createdAt,
			);
		}

		// Vendors without a vendor profile
		const profilessVendors = await db
			.select({ user: users })
			.from(users)
			.leftJoin(vendors, eq(vendors.userId, users.id))
			.where(and(eq(users.role, "vendor"), isNull(vendors.id)))
			.limit(100);
		for (const { user } of profilessVendors) {
			push(
				"vendor",
				"no_profile",
				"medium",
				"Vendor tanpa profil",
				`Akun vendor ${user.email} tidak memiliki profil vendor.`,
				"user",
				user.id,
				user.email,
				user.createdAt,
			);
		}

		// Funded/monitoring projects with no MRV reports at all
		const mrvlessProjects = await db
			.select({ project: projects })
			.from(projects)
			.leftJoin(emissionReports, eq(emissionReports.projectId, projects.id))
			.where(
				and(
					inArray(projects.status, ["funding", "monitoring"]),
					isNull(emissionReports.id),
				),
			)
			.orderBy(desc(projects.createdAt))
			.limit(100);
		for (const { project } of mrvlessProjects) {
			push(
				"project",
				"no_mrv",
				"low",
				"Proyek tanpa laporan MRV",
				`Proyek "${project.title}" berstatus ${project.status} tanpa laporan emisi.`,
				"project",
				project.id,
				project.title,
				project.createdAt,
			);
		}

		flags.sort(
			(a, b) =>
				SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
				(b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
		);

		const counts = {
			critical: 0,
			high: 0,
			medium: 0,
			low: 0,
			total: flags.length,
		};
		for (const flag of flags) counts[flag.severity]++;

		return c.json({ flags: flags.slice(0, 100), counts });
	}),
);
