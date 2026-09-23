import type {
	VendorLeaderboardEntry,
	VendorLeaderboardResponse,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import { vendorProfileId } from "../vendor.shared";
import * as repository from "./leaderboard.repository";

const EMPTY: VendorLeaderboardResponse = {
	tender: null,
	myProposalId: null,
	myAmount: null,
	myRank: null,
	entries: [],
};

/**
 * Ranking for one open tender: the lowest amount leads and the vendor's own row
 * is flagged. A closed or direct tender's offers are sealed, so it answers empty.
 */
export async function getVendorLeaderboard(
	db: GreenShiftDb,
	userId: number,
	tenderId?: number,
): Promise<VendorLeaderboardResponse> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return EMPTY;

	const target =
		tenderId === undefined
			? await repository.findTargetTender(db, vendorId)
			: await repository.findTenderTarget(db, tenderId, vendorId);
	if (!target) return EMPTY;
	if (target.tender.method !== "open") return EMPTY;

	const rows = await repository.listTenderProposals(db, target.tender.id);

	const entries: VendorLeaderboardEntry[] = rows.map((row, index) => ({
		rank: index + 1,
		proposalId: row.proposalId,
		vendorName: row.vendorName,
		isCurrentVendor: row.vendorId === vendorId,
		amount: row.amount,
		updatedAt: row.updatedAt.toISOString(),
	}));

	const mine = entries.find((entry) => entry.isCurrentVendor) ?? null;
	const own = target.proposal ?? null;

	return {
		tender: {
			id: target.tender.id,
			projectId: target.project.id,
			projectTitle: target.project.title,
			method: target.tender.method,
			status: target.tender.status,
			deadlineAt: iso(target.tender.deadlineAt),
			budgetMax: target.tender.budgetMax,
		},
		myProposalId: mine?.proposalId ?? own?.id ?? null,
		myAmount: mine?.amount ?? own?.amount ?? null,
		myRank: mine?.rank ?? null,
		entries,
	} satisfies VendorLeaderboardResponse;
}
