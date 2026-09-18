import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { VendorPortfolioBody, VendorPortfolioItem } from "../../contracts";
import { createDb } from "../../db";
import { auditLogs, vendorPortfolioItems, vendors } from "../../db/schema";
import type { ApiEnv } from "../../env";
import { requireJson } from "../../lib/http";
import { invalidNumber, mutationRateLimit } from "./helpers";

const factory = createFactory<ApiEnv>();

export const portfolioRoutes = new Hono<ApiEnv>();

const MAX_TEXT_LENGTH = 2000;

function toPortfolioItem(
	row: typeof vendorPortfolioItems.$inferSelect,
): VendorPortfolioItem {
	return {
		id: row.id,
		projectName: row.projectName,
		clientName: row.clientName,
		projectType: row.projectType,
		location: row.location,
		description: row.description,
		projectValue: row.projectValue,
		durationMonths: row.durationMonths,
		servicesProvided: row.servicesProvided,
		energySavingPercent: row.energySavingPercent,
		carbonReductionTons: row.carbonReductionTons,
		completionYear: row.completionYear,
		status: row.status,
		documentName: row.documentName,
	};
}

// Vendor-owned profile picture: past projects the vendor completed.
portfolioRoutes.get(
	"/portfolio",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, c.get("user").id))
			.limit(1);
		if (!profile) return c.json({ portfolio: [] });

		const rows = await db
			.select()
			.from(vendorPortfolioItems)
			.where(eq(vendorPortfolioItems.vendorId, profile.id))
			.orderBy(
				desc(vendorPortfolioItems.completionYear),
				desc(vendorPortfolioItems.id),
			);

		return c.json({ portfolio: rows.map(toPortfolioItem) });
	}),
);

portfolioRoutes.post(
	"/portfolio",
	...factory.createHandlers(async (c) => {
		const mediaTypeError = requireJson(c);
		if (mediaTypeError) return mediaTypeError;

		const rateError = await mutationRateLimit(c, "portfolio");
		if (rateError) return rateError;

		const body = (await c.req
			.json()
			.catch(() => null)) as VendorPortfolioBody | null;
		const projectName = body?.projectName?.trim();
		const clientName = body?.clientName?.trim();
		const projectValue = body?.projectValue;

		if (
			!projectName ||
			!clientName ||
			projectName.length > 200 ||
			clientName.length > 200 ||
			typeof projectValue !== "number" ||
			!Number.isFinite(projectValue) ||
			projectValue <= 0 ||
			invalidNumber(body?.durationMonths, {
				integer: true,
				min: 0,
				max: 600,
			}) ||
			invalidNumber(body?.energySavingPercent, { min: 0, max: 100 }) ||
			invalidNumber(body?.carbonReductionTons, { min: 0 }) ||
			invalidNumber(body?.completionYear, {
				integer: true,
				min: 1900,
				max: 2200,
			}) ||
			(body?.description !== undefined &&
				(typeof body.description !== "string" ||
					body.description.length > MAX_TEXT_LENGTH)) ||
			(body?.servicesProvided !== undefined &&
				(typeof body.servicesProvided !== "string" ||
					body.servicesProvided.length > MAX_TEXT_LENGTH))
		) {
			return c.json(
				{
					error: { code: "VALIDATION", message: "Invalid portfolio item" },
				},
				400,
			);
		}

		const db = createDb(c.env.DB);
		const userId = c.get("user").id;

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, userId))
			.limit(1);
		if (!profile) {
			return c.json(
				{
					error: {
						code: "VALIDATION",
						message:
							"Complete your vendor profile before adding portfolio items",
					},
				},
				400,
			);
		}

		const [inserted] = await db
			.insert(vendorPortfolioItems)
			.values({
				vendorId: profile.id,
				projectName,
				clientName,
				projectType: body?.projectType ?? null,
				location: body?.location ?? null,
				description: body?.description ?? null,
				projectValue,
				durationMonths: body?.durationMonths ?? null,
				servicesProvided: body?.servicesProvided ?? null,
				energySavingPercent: body?.energySavingPercent ?? null,
				carbonReductionTons: body?.carbonReductionTons ?? null,
				completionYear: body?.completionYear ?? null,
				status: body?.status === "VERIFIED" ? "VERIFIED" : "COMPLETED",
				documentName: body?.documentName ?? null,
			})
			.returning();

		if (!inserted) {
			return c.json(
				{ error: { code: "INTERNAL", message: "Failed to add item" } },
				500,
			);
		}

		await db.insert(auditLogs).values({
			userId,
			action: "vendor.portfolio.created",
			entityType: "vendor_portfolio_item",
			entityId: inserted.id,
		});

		return c.json({ item: toPortfolioItem(inserted) }, 201);
	}),
);

portfolioRoutes.delete(
	"/portfolio/:id",
	...factory.createHandlers(async (c) => {
		const id = Number(c.req.param("id"));
		if (!Number.isInteger(id) || id <= 0) {
			return c.json(
				{ error: { code: "VALIDATION", message: "Invalid ID" } },
				400,
			);
		}

		const db = createDb(c.env.DB);
		const userId = c.get("user").id;

		const [profile] = await db
			.select({ id: vendors.id })
			.from(vendors)
			.where(eq(vendors.userId, userId))
			.limit(1);
		if (!profile) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Portfolio item not found" } },
				404,
			);
		}

		const [deleted] = await db
			.delete(vendorPortfolioItems)
			.where(
				and(
					eq(vendorPortfolioItems.id, id),
					eq(vendorPortfolioItems.vendorId, profile.id),
				),
			)
			.returning({ id: vendorPortfolioItems.id });

		if (!deleted) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "Portfolio item not found" } },
				404,
			);
		}

		await db.insert(auditLogs).values({
			userId,
			action: "vendor.portfolio.deleted",
			entityType: "vendor_portfolio_item",
			entityId: deleted.id,
		});

		return c.json({ ok: true });
	}),
);
