import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { BusinessRiskInsightRequest } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound } from "../../../lib/response";
import * as repository from "../projects/projects.repository";
import { eleanorInsight } from "./eleanor.service";
import { readProjectRisk, writeProjectInsight } from "./risk.service";

const factory = createFactory<ApiEnv>();

export const riskRoutes = new Hono<ApiEnv>();

// Mirrors the frontend's `ProjectRiskResult`, so the card renders it without a mapper.
riskRoutes.get(
	"/projects/:id/risk",
	...factory.createHandlers(async (c) => {
		const raw = c.req.param("id");
		if (!raw || !/^\d+$/.test(raw)) return apiError(c, "INVALID_ID");
		const projectId = Number(raw);

		const db = createDb(c.env.DB);
		const project = await repository.findCompanyProject(
			db,
			projectId,
			c.get("user").id,
		);
		if (!project) return apiNotFound(c, "Project");

		const result = await readProjectRisk(db, projectId, c.get("user").id);
		if (result.outcome === "not_found") {
			return apiNotFound(c, "Risk assessment");
		}

		if (result.needsInsight) {
			c.executionCtx.waitUntil(
				writeProjectInsight(c.env, db, projectId, result.risk),
			);
		}

		return c.json({ risk: result.risk });
	}),
);

// The reading is cached against the figures it was written about, so nothing is written here.
const RISK_LEVELS = ["Low", "Medium", "High"] as const;
type RiskLevelValue = (typeof RISK_LEVELS)[number];
/** Four areas, one per contribution to the score. */
const MAX_AREAS = 4;
const MAX_LINES = 8;
const MAX_LINE_CHARS = 400;

function isScore(value: unknown): value is number {
	return (
		typeof value === "number" &&
		Number.isFinite(value) &&
		value >= 0 &&
		value <= 100
	);
}

function isRiskLevel(value: unknown): value is RiskLevelValue {
	return (RISK_LEVELS as readonly unknown[]).includes(value);
}

/** A tone is one of the bands, or nothing at all for an unscored area. */
function isRiskTone(value: unknown): value is RiskLevelValue | null {
	return value === null || isRiskLevel(value);
}

function readField(value: unknown, key: string): unknown {
	return typeof value === "object" && value !== null
		? (value as Record<string, unknown>)[key]
		: undefined;
}

function readLines(value: unknown): string[] | null {
	if (!Array.isArray(value) || value.length > MAX_LINES) return null;
	const lines: string[] = [];
	for (const line of value) {
		if (typeof line !== "string" || line.length > MAX_LINE_CHARS) return null;
		lines.push(line);
	}
	return lines;
}

/** How much she writes. An absent mode is the full reading. */
function readMode(
	value: unknown,
): BusinessRiskInsightRequest["mode"] | undefined {
	if (value === undefined) return undefined;
	return value === "brief" || value === "full" ? value : undefined;
}

// Every field is narrowed here: the score and the band decide what the prose may claim.
function readInsightRequest(raw: unknown): BusinessRiskInsightRequest | null {
	const score = readField(raw, "score");
	const level = readField(raw, "level");
	const success = readField(raw, "success");
	const breakdown = readField(raw, "breakdown");

	if (!isScore(score) || !isScore(success) || !isRiskLevel(level)) return null;
	if (!Array.isArray(breakdown) || breakdown.length !== MAX_AREAS) return null;

	const areas: BusinessRiskInsightRequest["breakdown"] = [];
	for (const row of breakdown) {
		const key = readField(row, "key");
		const label = readField(row, "label");
		const tone = readField(row, "tone");
		const pct = readField(row, "pct");
		if (
			typeof key !== "string" ||
			typeof label !== "string" ||
			label.length > MAX_LINE_CHARS ||
			!isRiskTone(tone) ||
			!isScore(pct)
		) {
			return null;
		}
		areas.push({ key, label, tone, pct });
	}

	const factors = readLines(readField(raw, "factors"));
	const mitigations = readLines(readField(raw, "mitigations"));
	if (factors === null || mitigations === null) return null;

	const mode = readMode(readField(raw, "mode"));
	return {
		score,
		level,
		success,
		breakdown: areas,
		factors,
		mitigations,
		mode,
	};
}

riskRoutes.post(
	"/risk/insight",
	mutationRateLimit("business", "risk-insight"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const body = readInsightRequest(await c.req.json().catch(() => null));
		if (body === null) return apiError(c, "VALIDATION");

		const insight = await eleanorInsight(c.env, body, body.mode);
		return c.json({ insight });
	}),
);
