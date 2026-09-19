import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type {
	BrokerProfile,
	BrokerProfileBody,
	BrokerVerificationStatus,
} from "../../../contracts";
import { createDb } from "../../../db";
import type { brokerProfiles } from "../../../db/schema";
import type { ApiEnv } from "../../../env";
import {
	invalidOptionalText,
	iso,
	MAX_NAME,
	MAX_SHORT_TEXT,
	MAX_TEXT,
} from "../../../lib/format";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiSuccess } from "../../../lib/response";
import { createProfile, loadProfile } from "./profile.repository";
import { saveBrokerProfile } from "./profile.service";

const factory = createFactory<ApiEnv>();
const mutationLimit = mutationRateLimit("broker", "profile");

export const profileRoutes = new Hono<ApiEnv>();

/** Verification result shown to the broker (§6). */
export function verificationStatus(
	row: typeof brokerProfiles.$inferSelect,
): BrokerVerificationStatus {
	if (row.verifiedAt) return "VERIFIED";
	if (row.rejectionReason) return "REJECTED";
	return "NOT_VERIFIED";
}

export function toBrokerProfile(
	profile: typeof brokerProfiles.$inferSelect,
): BrokerProfile {
	return {
		id: profile.id,
		userId: profile.userId,
		companyName: profile.companyName,
		description: profile.description,
		representative: profile.representative,
		contactEmail: profile.contactEmail,
		contactPhone: profile.contactPhone,
		website: profile.website,
		address: profile.address,
		nib: profile.nib,
		financialLicenseNumber: profile.financialLicenseNumber,
		licenseAuthority: profile.licenseAuthority,
		verificationStatus: verificationStatus(profile),
		submittedAt: iso(profile.submittedAt),
		verifiedAt: iso(profile.verifiedAt),
		rejectionReason: profile.rejectionReason,
	};
}

// ── profile ───────────────────────────────────────────────
profileRoutes.get(
	"/profile",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const userId = c.get("user").id;
		const existing = await loadProfile(db, userId);
		if (existing) return c.json({ profile: toBrokerProfile(existing) });

		const created = await createProfile(db, userId, c.get("user").name);
		return c.json({ profile: toBrokerProfile(created) });
	}),
);

// Upsert: saves the firm profile and, when licence data is filed, records the
// submission for verification. Self-service registration (§6): the broker can
// never verify itself.
profileRoutes.put(
	"/profile",
	mutationLimit,
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<BrokerProfileBody> | null;
		const companyName = body?.companyName;

		const optional: Array<[string, string | undefined, number]> = [
			["description", body?.description, MAX_TEXT],
			["representative", body?.representative, MAX_SHORT_TEXT],
			["contactEmail", body?.contactEmail, MAX_SHORT_TEXT],
			["contactPhone", body?.contactPhone, MAX_SHORT_TEXT],
			["website", body?.website, MAX_SHORT_TEXT],
			["address", body?.address, MAX_SHORT_TEXT],
			["nib", body?.nib, MAX_SHORT_TEXT],
			["financialLicenseNumber", body?.financialLicenseNumber, MAX_SHORT_TEXT],
			["licenseAuthority", body?.licenseAuthority, MAX_SHORT_TEXT],
		];

		const invalidField = optional.some(([, value, max]) =>
			invalidOptionalText(value, max),
		);

		if (
			typeof companyName !== "string" ||
			companyName.trim().length === 0 ||
			companyName.length > MAX_NAME ||
			invalidField
		) {
			return apiError(c, "VALIDATION");
		}

		const db = createDb(c.env.DB);
		const userId = c.get("user").id;
		const saved = await saveBrokerProfile(db, userId, {
			...body,
			companyName,
		});

		return apiSuccess(
			c,
			{ profile: toBrokerProfile(saved) },
			"Changes saved successfully",
		);
	}),
);
