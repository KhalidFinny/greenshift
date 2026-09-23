// The company's verification endpoints: the only routes a business account reaches before an admin verdict.

import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { CompanyVerificationBody } from "../../../contracts";
import { registerLimits } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { requireJsonBody } from "../../../lib/http";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { submitCompanyVerification } from "./verification.service";
import { verificationDocumentRoutes } from "./verification-documents.routes";
import {
	readCompanyVerification,
	saveCompanyDetails,
} from "./verification-pack.service";

const factory = createFactory<ApiEnv>();

export const verificationRoutes = new Hono<ApiEnv>();

verificationRoutes.get(
	"/verification",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const verification = await readCompanyVerification(db, c.get("user").id);
		if (!verification) return apiNotFound(c, "Company");
		return c.json({ verification });
	}),
);

verificationRoutes.put(
	"/verification",
	mutationRateLimit("business", "verification"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const body = (await c.req
			.json()
			.catch(() => null)) as Partial<CompanyVerificationBody> | null;
		const companyName = body?.companyName?.trim();
		const industrySector = body?.industrySector?.trim();
		const address = body?.address?.trim();
		const representative = body?.representative?.trim();
		const contactPhone = body?.contactPhone?.trim() ?? "";
		const nib = body?.nib?.trim();
		const npwp = body?.npwp?.trim();

		if (
			!companyName ||
			!industrySector ||
			!address ||
			!representative ||
			!nib ||
			!npwp ||
			companyName.length > registerLimits.organizationName ||
			industrySector.length > registerLimits.industry ||
			address.length > registerLimits.address ||
			representative.length > registerLimits.name ||
			contactPhone.length > registerLimits.phone ||
			nib.length > registerLimits.legalId ||
			npwp.length > registerLimits.legalId
		) {
			return apiError(c, "VALIDATION", "Check the company details.", {
				fields: { companyName: "Every field is required." },
			});
		}

		const db = createDb(c.env.DB);
		const result = await saveCompanyDetails(db, c.get("user").id, {
			companyName,
			industrySector,
			address,
			representative,
			contactPhone,
			nib,
			npwp,
		});

		if (result.status === "not_found") return apiNotFound(c, "Company");
		if (result.status === "verified") {
			return apiError(
				c,
				"INVALID_STATE",
				"A verified company's details are not edited here. Contact an administrator to change them.",
			);
		}
		return apiSuccess(
			c,
			{ verification: result.verification },
			"Company details saved",
		);
	}),
);

verificationRoutes.post(
	"/verification/submit",
	mutationRateLimit("business", "verification"),
	requireJsonBody,
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const result = await submitCompanyVerification(db, c.env, c.get("user").id);

		if (result.status === "not_found") return apiNotFound(c, "Company");
		if (result.status === "verified") {
			return apiError(c, "INVALID_STATE", "This company is already verified.");
		}
		if (result.status === "incomplete") {
			return apiError(
				c,
				"VALIDATION",
				`File the whole pack before submitting: ${result.missing.join(", ")}.`,
				{ fields: { missing: result.missing.join(", ") } },
			);
		}
		return apiSuccess(
			c,
			{ verification: result.verification },
			"Verification filed. An administrator will review it.",
		);
	}),
);

verificationRoutes.route("/", verificationDocumentRoutes);
