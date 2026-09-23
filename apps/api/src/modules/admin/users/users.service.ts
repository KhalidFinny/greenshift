import type { AdminCompanyVerification } from "../../../contracts";
import {
	apiRoutes,
	companyDocumentLabels,
	companyDocumentSlots,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { iso } from "../../../lib/format";
import {
	applyUserVerification,
	findUserForVerification,
	findUserWithDocuments,
} from "./users.repository";

export type VerifyUserResult =
	| { ok: true }
	| { ok: false; reason: "not_found" }
	| { ok: false; reason: "admin_locked" }
	| { ok: false; reason: "pack_not_filed" };

/**
 * Applies a verification decision to a user; admin accounts can never be
 * unverified. A company must have filed its pack first, unless turned down.
 */
export async function verifyUser(
	db: GreenShiftDb,
	input: {
		id: number;
		verified: boolean;
		actorId: number;
		rejectionReason?: string | null;
	},
): Promise<VerifyUserResult> {
	const user = await findUserForVerification(db, input.id);
	if (!user) return { ok: false, reason: "not_found" };
	if (user.role === "admin" && input.verified === false) {
		return { ok: false, reason: "admin_locked" };
	}
	if (input.verified && user.role === "business") {
		const account = await findUserWithDocuments(db, input.id);
		if (!account || account.user.legalDocsSubmittedAt === null) {
			return { ok: false, reason: "pack_not_filed" };
		}
	}

	await applyUserVerification(db, {
		id: input.id,
		verified: input.verified,
		actorId: input.actorId,
		from: iso(user.verifiedAt),
		rejectionReason: input.rejectionReason ?? null,
	});
	return { ok: true };
}

/**
 * The account as an administrator reviews it, with certificate URLs pointing at
 * the admin's own read route, so only this account's file is opened.
 */
export async function readUserVerification(
	db: GreenShiftDb,
	id: number,
): Promise<AdminCompanyVerification | null> {
	const row = await findUserWithDocuments(db, id);
	if (!row) return null;

	const bySlot = new Map(
		row.documents.map((document) => [document.slot, document]),
	);

	return {
		userId: row.user.id,
		companyName: row.user.companyName,
		industrySector: row.user.industrySector,
		address: row.user.address,
		representative: row.user.name,
		contactEmail: row.user.email,
		contactPhone: row.user.phone,
		nib: row.user.nib,
		npwp: row.user.npwp,
		submittedAt: iso(row.user.legalDocsSubmittedAt),
		verifiedAt: iso(row.user.verifiedAt),
		rejectionReason: row.user.verificationRejectionReason,
		documents: companyDocumentSlots.map((slot) => {
			const document = bySlot.get(slot);
			return {
				slot,
				label: companyDocumentLabels[slot],
				fileName: document?.fileName ?? null,
				sizeBytes: document?.sizeBytes ?? null,
				uploadedAt: document ? iso(document.uploadedAt) : null,
				scan: document?.scan ?? null,
				downloadUrl: document
					? apiRoutes.adminUserVerificationDocument.path
							.replace(":id", String(id))
							.replace(":slot", slot)
					: null,
			};
		}),
	};
}
