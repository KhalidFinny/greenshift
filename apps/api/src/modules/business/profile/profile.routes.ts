import { Hono } from "hono";
import { createFactory } from "hono/factory";
import {
	type BusinessProfileBody,
	type BusinessProfileResponse,
	industrySectors,
	registerLimits,
} from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { invalidOptionalText } from "../../../lib/format";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiSuccess } from "../../../lib/response";
import {
	type CompanyProfileValues,
	getBusinessProfile,
	saveBusinessProfile,
} from "./profile.service";

const factory = createFactory<ApiEnv>();
const mutationLimit = mutationRateLimit("business", "profile");
const knownSectors: readonly string[] = industrySectors;

/** Blank clears the field, so an emptied input stores no value rather than "". */
function optionalText(value: string | undefined): string | null | undefined {
	if (value === undefined) return undefined;
	const trimmed = value.trim();
	return trimmed === "" ? null : trimmed;
}

export const profileRoutes = new Hono<ApiEnv>();

profileRoutes.get(
	"/profile",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const profile = await getBusinessProfile(db, c.get("user").id);
		if (!profile) return apiError(c, "NOT_FOUND", "Account not found");

		return c.json({ profile } satisfies BusinessProfileResponse);
	}),
);

// The company's own record: the organization it registers as and the person who
// represents it. The sign-in email is identity, not writable here.
profileRoutes.put(
	"/profile",
	mutationLimit,
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<BusinessProfileBody> | null;

		const rawCompanyName = body?.companyName;
		const companyName =
			typeof rawCompanyName === "string" ? rawCompanyName.trim() : "";
		const representative = optionalText(body?.representative);
		const industrySector = optionalText(body?.industrySector);
		const address = optionalText(body?.address);
		const contactPhone = optionalText(body?.contactPhone);

		if (companyName.length === 0) {
			return apiError(c, "VALIDATION", "A company name is required");
		}

		const invalidCompanyName =
			rawCompanyName !== undefined &&
			(typeof rawCompanyName !== "string" ||
				rawCompanyName.length > registerLimits.organizationName);
		const invalidField =
			invalidOptionalText(body?.representative, registerLimits.name) ||
			invalidOptionalText(body?.industrySector, registerLimits.industry) ||
			invalidOptionalText(body?.address, registerLimits.address) ||
			invalidOptionalText(body?.contactPhone, registerLimits.phone);
		const invalidSector =
			typeof industrySector === "string" &&
			!knownSectors.includes(industrySector);

		if (invalidCompanyName || invalidField || invalidSector) {
			return apiError(
				c,
				"VALIDATION",
				invalidSector
					? "Pick an industry sector from the list"
					: "One of the profile fields is longer than the field allows",
			);
		}

		const values: CompanyProfileValues = {
			companyName,
			// A blank name keeps the stored representative, since the account row
			// requires one.
			...(representative ? { representative } : {}),
			industrySector,
			address,
			contactPhone,
		};

		const db = createDb(c.env.DB);
		const saved = await saveBusinessProfile(db, c.get("user").id, values);
		if (!saved) return apiError(c, "NOT_FOUND", "Account not found");

		return apiSuccess(
			c,
			{ profile: saved } satisfies BusinessProfileResponse,
			"Company profile saved",
		);
	}),
);
