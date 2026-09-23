// Recording the company's choice and opening the tender it implies.

import type {
	BusinessMatchmakingMethod,
	BusinessTender,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import * as procurement from "../procurement/procurement.service";
import * as projectsRepository from "../projects/projects.repository";
import * as repository from "./matchmaking.repository";

/** The three procurement routes, in the order the picker renders them. */
export const PROCUREMENT_METHODS: Array<{
	id: BusinessMatchmakingMethod;
	label: string;
	desc: string;
}> = [
	{
		id: "open",
		label: "Open Bidding",
		desc: "Every verified vendor can bid, and all of them see the bids as they come in.",
	},
	{
		id: "closed",
		label: "Closed Bidding",
		desc: "Only the recommended vendors are invited, and no bidder sees another's price.",
	},
	{
		id: "direct",
		label: "Direct Selection",
		desc: "One appointed vendor, privately, with no competing bids.",
	},
];

export type SelectionResult =
	| {
			outcome: "ok";
			vendorId: number | null;
			vendorName: string | null;
			method: BusinessMatchmakingMethod;
			tender: BusinessTender;
	  }
	| { outcome: "not_found" }
	| { outcome: "unknown_method" }
	| { outcome: "unknown_vendor" }
	| { outcome: "vendor_required" }
	| { outcome: "deadline_invalid" }
	| { outcome: "tender_locked"; status: string };

export async function saveSelection(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
	body: {
		vendorId?: unknown;
		method?: unknown;
		deadlineAt?: unknown;
		budgetMin?: unknown;
		budgetMax?: unknown;
	},
): Promise<SelectionResult> {
	const project = await projectsRepository.findCompanyProject(
		db,
		projectId,
		companyId,
	);
	if (!project) return { outcome: "not_found" };

	const method = PROCUREMENT_METHODS.find((m) => m.id === body.method);
	if (!method) return { outcome: "unknown_method" };

	// Only the direct route names a vendor before the tender opens; open and closed invite their own pool.
	const rawVendorId = Number(body.vendorId);
	const namedVendorId =
		Number.isInteger(rawVendorId) && rawVendorId > 0 ? rawVendorId : null;
	if (method.id === "direct" && namedVendorId === null) {
		return { outcome: "vendor_required" };
	}

	const vendor =
		namedVendorId === null
			? null
			: await repository.findScoredVendor(db, projectId, namedVendorId);
	if (namedVendorId !== null && !vendor) return { outcome: "unknown_vendor" };

	const deadlineAt = new Date(String(body.deadlineAt ?? ""));
	if (Number.isNaN(deadlineAt.getTime())) {
		return { outcome: "deadline_invalid" };
	}

	// The tender opens first: a deadline the server refuses must not leave an appointment recorded.
	const opened = await procurement.openTender(db, companyId, projectId, {
		method: method.id,
		deadlineAt,
		budgetMin: numberOrNull(body.budgetMin),
		budgetMax: numberOrNull(body.budgetMax),
	});
	if (opened.outcome === "deadline_invalid") {
		return { outcome: "deadline_invalid" };
	}
	if (opened.outcome === "tender_locked") {
		return { outcome: "tender_locked", status: opened.status };
	}

	if (vendor) {
		await repository.upsertAssignment(db, {
			projectId,
			vendorId: vendor.vendorId,
			vendorName: vendor.vendorName,
			method: method.id,
		});
	}

	return {
		outcome: "ok",
		vendorId: vendor?.vendorId ?? null,
		vendorName: vendor?.vendorName ?? null,
		method: method.id,
		tender: procurement.toTender(opened.tender, {
			bidCount: 0,
			awardedVendorName: null,
		}),
	};
}

function numberOrNull(value: unknown): number | null {
	const parsed = Number(value);
	return value === null ||
		value === undefined ||
		value === "" ||
		!Number.isFinite(parsed)
		? null
		: parsed;
}
