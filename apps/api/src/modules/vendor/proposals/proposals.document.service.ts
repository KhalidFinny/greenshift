import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import { recordAudit, vendorProfileId } from "../vendor.shared";
import * as repository from "./proposals.repository";
import * as writeRepository from "./proposals.write.repository";

/** The proposal document: a PDF the bidder files with the bid. 10 MB is generous. */
export const MAX_PROPOSAL_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** A proposal document is a PDF, and only a PDF: the company reads it in the browser's viewer. */
export function isProposalPdf(file: File): boolean {
	return (
		file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
	);
}

export type AttachProposalDocumentResult =
	| { status: "ok"; documentName: string }
	| { status: "not_found" }
	| { status: "too_large" }
	| { status: "unsupported" };

/** Files the PDF on one of the vendor's own bids; the object lands first and goes again if the row write fails. */
export async function attachProposalDocument(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	proposalId: number,
	file: File,
): Promise<AttachProposalDocumentResult> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { status: "not_found" };

	if (file.size > MAX_PROPOSAL_DOCUMENT_BYTES) return { status: "too_large" };
	if (!isProposalPdf(file)) return { status: "unsupported" };

	const existing = await repository.findVendorProposalDocument(
		db,
		proposalId,
		vendorId,
	);
	if (!existing) return { status: "not_found" };

	const fileKey = `vendor-proposals/${vendorId}/${proposalId}/${file.name}`;
	await env.R2.put(fileKey, await file.arrayBuffer(), {
		httpMetadata: { contentType: "application/pdf" },
	});

	const updated = await writeRepository.setProposalDocument(
		db,
		proposalId,
		vendorId,
		{ documentName: file.name, documentKey: fileKey },
	);
	if (!updated) {
		await env.R2.delete(fileKey);
		return { status: "not_found" };
	}

	// Replacing a document leaves the old object behind otherwise.
	if (existing.documentKey && existing.documentKey !== fileKey) {
		await env.R2.delete(existing.documentKey);
	}

	await recordAudit(db, {
		userId,
		action: "proposal.document",
		entityType: "proposal",
		entityId: proposalId,
	});

	return { status: "ok", documentName: updated.documentName ?? file.name };
}
