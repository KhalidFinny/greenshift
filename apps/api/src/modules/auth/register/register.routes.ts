import { Hono } from "hono";
import { createFactory } from "hono/factory";
import {
	credentialLimits,
	industrySectors,
	type OrganizationType,
	organizationTypes,
	type RegisterBody,
	registerLimits,
	vendorServiceCategories,
} from "../../../contracts";
import type { ApiEnv } from "../../../env";
import { clientIp, enforceRateLimit } from "../../../lib/rate-limit";
import { apiError, apiSuccess } from "../../../lib/response";
import { sessionCookie } from "../../../lib/session";
import { registerUser } from "./register.service";

const factory = createFactory<ApiEnv>();

export const registerRoutes = new Hono<ApiEnv>();

const MAX_NAME = registerLimits.name;
const MAX_ORGANIZATION = registerLimits.organizationName;
const MAX_PHONE = registerLimits.phone;
const MAX_ADDRESS = registerLimits.address;
const MAX_BUSINESS_INFO = registerLimits.businessInfo;
const MAX_LEGAL_ID = registerLimits.legalId;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits with the separators an Indonesian number is written with. */
const PHONE_RE = /^[+()\d][+()\d\s-]*$/;
/** NIB and NPWP as they are written on the document; format is not enforced. */
const LEGAL_ID_RE = /^[\d.\-\s]+$/;

/** Trims a body field; a missing or blank value becomes null. */
function field(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

/** The first entry whose value is longer than its limit. */
function overLength(
	entries: ReadonlyArray<readonly [string, string | null, number]>,
): readonly [string, string | null, number] | undefined {
	return entries.find(([, value, max]) => value !== null && value.length > max);
}

function isOrganizationType(value: unknown): value is OrganizationType {
	return (organizationTypes as readonly unknown[]).includes(value);
}

registerRoutes.post(
	"/register",
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<RegisterBody> | null;

		if (!isOrganizationType(body?.accountType)) {
			return apiError(
				c,
				"VALIDATION",
				"Choose whether you are registering as a company or a vendor",
			);
		}
		const accountType = body.accountType;

		const name = field(body?.name);
		const email =
			typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
		const password = typeof body?.password === "string" ? body.password : "";
		const phone = field(body?.phone);
		const organizationName = field(body?.organizationName);
		const industry = field(body?.industry);
		const address = field(body?.address);
		const businessInfo = field(body?.businessInfo);
		const nib = field(body?.nib);
		const npwp = field(body?.npwp);

		// Length before presence: an over-long value is present, and saying it is
		// required would send the user looking for a field they already filled.
		const tooLong = overLength([
			["Name", name, MAX_NAME],
			["Phone", phone, MAX_PHONE],
			["Organization name", organizationName, MAX_ORGANIZATION],
			["Industry", industry, MAX_NAME],
			["Address", address, MAX_ADDRESS],
			["Company information", businessInfo, MAX_BUSINESS_INFO],
			["NIB", nib, MAX_LEGAL_ID],
			["NPWP", npwp, MAX_LEGAL_ID],
		]);
		if (tooLong) {
			return apiError(c, "VALIDATION", `${tooLong[0]} is too long`);
		}
		if (!name || !phone || !organizationName || !industry || !address) {
			return apiError(
				c,
				"VALIDATION",
				"Name, phone, organization name, industry, and address are required",
			);
		}
		if (!EMAIL_RE.test(email)) {
			return apiError(c, "VALIDATION", "Invalid email");
		}
		if (email.length > credentialLimits.email) {
			return apiError(c, "VALIDATION", "Email is too long");
		}
		if (password.length < 8) {
			return apiError(
				c,
				"VALIDATION",
				"Password must be at least 8 characters",
			);
		}
		if (password.length > credentialLimits.password) {
			return apiError(c, "VALIDATION", "Password is too long");
		}
		if (!PHONE_RE.test(phone)) {
			return apiError(c, "VALIDATION", "Enter a phone number");
		}
		// The two lists are the vocabulary the rest of the platform compares against:
		// a vendor's category and a company's sector must be values some surface can act on.
		const sectors: readonly string[] =
			accountType === "vendor" ? vendorServiceCategories : industrySectors;
		if (!sectors.includes(industry)) {
			return apiError(
				c,
				"VALIDATION",
				accountType === "vendor"
					? "Choose a service category from the list"
					: "Choose an industry from the list",
			);
		}
		if ((nib && !LEGAL_ID_RE.test(nib)) || (npwp && !LEGAL_ID_RE.test(npwp))) {
			return apiError(c, "VALIDATION", "Enter NIB and NPWP as digits");
		}

		await enforceRateLimit(c.env, `register:ip:${clientIp(c.req.raw)}`, 5, 900);

		const result = await registerUser(c.env, {
			accountType,
			name,
			email,
			password,
			phone,
			organizationName,
			industry,
			address,
			businessInfo,
			nib,
			npwp,
		});
		if (result.status === "email-taken") {
			return apiError(c, "EMAIL_TAKEN");
		}

		c.header("Set-Cookie", sessionCookie(result.token));
		return apiSuccess(
			c,
			{ user: result.user },
			accountType === "vendor"
				? "Vendor account created. Add your legal details in Settings to get verified."
				: "Company account created. Submit your first project to start.",
			201,
		);
	}),
);
