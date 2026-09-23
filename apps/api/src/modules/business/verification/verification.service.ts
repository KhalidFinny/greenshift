// The company's verification: filing the pack and scanning it is where the verdict comes from.

import type {
	CompanyDocumentScan,
	CompanyDocumentSlot,
	CompanyVerification,
} from "../../../contracts";
import { companyDocumentLabels } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import { insertNotification } from "../notifications/notifications.repository";
import { scanCompanyDocument } from "./document-scan.service";
import * as repository from "./verification.repository";
import {
	isCompanyDocumentSlot,
	RESCAN_LIMIT,
	readCompanyVerification,
} from "./verification-pack.service";

export type {
	AttachDocumentResult,
	CompanyDocumentStream,
	RemoveDocumentResult,
} from "./verification-documents.service";
export {
	attachCompanyDocument,
	readCompanyDocument,
	readCompanyDocumentForAdmin,
	removeCompanyDocument,
} from "./verification-documents.service";
export type { SaveDetailsResult } from "./verification-pack.service";
export {
	isCompanyDocumentSlot,
	RESCAN_LIMIT,
	readCompanyVerification,
	saveCompanyDetails,
} from "./verification-pack.service";

export type SubmitVerificationResult =
	| { status: "ok"; verification: CompanyVerification }
	| { status: "not_found" }
	| { status: "verified" }
	| { status: "incomplete"; missing: string[] };

// The pack has to be complete before any of this: there is nothing to scan otherwise.
export async function submitCompanyVerification(
	db: GreenShiftDb,
	env: Env,
	userId: number,
): Promise<SubmitVerificationResult> {
	const account = await repository.findAccount(db, userId);
	if (!account) return { status: "not_found" };
	if (account.verificationState === "VERIFIED") return { status: "verified" };

	const before = await readCompanyVerification(db, userId);
	if (!before) return { status: "not_found" };
	if (before.missing.length > 0) {
		return { status: "incomplete", missing: before.missing };
	}

	const submittedAt = new Date();
	await repository.markVerificationSubmitted(db, userId, submittedAt);

	// Each verdict is stored with the document it read, so the company and the reviewer see the same reading.
	const rows = await repository.listCompanyDocuments(db, userId);
	const scans: Array<{ slot: CompanyDocumentSlot; scan: CompanyDocumentScan }> =
		[];
	for (const row of rows) {
		if (!isCompanyDocumentSlot(row.slot)) continue;
		const object = await env.R2.get(row.fileKey);
		if (!object) {
			scans.push({
				slot: row.slot,
				scan: {
					verdict: "UNREADABLE",
					documentType: null,
					companyName: null,
					registrationNumber: null,
					note: "The filed file could not be opened. File the certificate again.",
					model: null,
					at: submittedAt.toISOString(),
				},
			});
			continue;
		}
		const scan = await scanCompanyDocument(env, {
			subject: row.slot,
			fileName: row.fileName,
			contentType: row.contentType,
			companyName: account.companyName ?? "",
			identityNumbers: [
				{ label: "NIB", value: account.nib ?? "" },
				{ label: "NPWP", value: account.npwp ?? "" },
			],
			bytes: await object.arrayBuffer(),
		});
		await repository.saveDocumentScan(db, userId, row.slot, scan);
		scans.push({ slot: row.slot, scan });
	}

	const mismatched = scans.filter((entry) => entry.scan.verdict === "MISMATCH");
	const unreadableScans = scans.filter(
		(entry) => entry.scan.verdict === "UNREADABLE",
	);

	if (mismatched.length > 0) {
		const reason = mismatched
			.map(
				(entry) => `${companyDocumentLabels[entry.slot]}: ${entry.scan.note}`,
			)
			.join(" ");
		await repository.setVerificationState(db, userId, {
			state: "REJECTED",
			rejectionReason: reason,
		});
		await insertNotification(db, {
			userId,
			type: "verification",
			title: "Company verification could not be confirmed",
			body: reason,
			link: "/business/verification",
		});
	} else if (unreadableScans.length > 0) {
		const attempts = account.verificationScanAttempts + 1;
		const reason = unreadableScans
			.map(
				(entry) => `${companyDocumentLabels[entry.slot]}: ${entry.scan.note}`,
			)
			.join(" ");
		if (attempts >= RESCAN_LIMIT) {
			// Out of rescans: a person reads it, with the readings in front of them.
			await repository.setVerificationState(db, userId, {
				state: "PENDING",
				scanAttempts: attempts,
			});
			await insertNotification(db, {
				userId,
				type: "verification",
				title: "Company verification is with an administrator",
				body: "The documents could not be read automatically, so an administrator will review them. Nothing else is needed from you for now.",
				link: "/business/verification",
			});
		} else {
			await repository.setVerificationState(db, userId, {
				state: "NEEDS_RESCAN",
				scanAttempts: attempts,
			});
			await insertNotification(db, {
				userId,
				type: "verification",
				title: "A clearer scan is needed",
				body: reason,
				link: "/business/verification",
			});
		}
	} else {
		await repository.setVerificationState(db, userId, {
			state: "VERIFIED",
			verified: true,
		});
		await insertNotification(db, {
			userId,
			type: "verification",
			title: "Company verified",
			body: `Both certificates were read and match your company details. The platform is open to you.`,
			link: "/business",
		});
	}

	const verification = await readCompanyVerification(db, userId);
	return verification
		? { status: "ok", verification }
		: { status: "not_found" };
}
