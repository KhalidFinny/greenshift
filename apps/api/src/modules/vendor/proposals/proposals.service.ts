import type { ProposalDetail, ProposalSummary } from "../../../contracts";
import { apiRoutes } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { proposals } from "../../../db/schema";
import type { Env } from "../../../env";
import { iso } from "../../../lib/format";
import {
	getProposalDetail,
	isTenderVisibleTo,
	recordAudit,
	vendorProfileId,
} from "../vendor.shared";
import * as repository from "./proposals.repository";

function proposalSummary(
	p: typeof proposals.$inferSelect,
	project: { id: number; title: string },
	tender: { status: string; deadlineAt: Date | null },
): ProposalSummary {
	return {
		id: p.id,
		tenderId: p.tenderId,
		projectId: project.id,
		projectTitle: project.title,
		amount: p.amount,
		status: p.status,
		revisionCount: p.revisionCount ?? 0,
		documentName: p.documentName,
		documentUrl: p.documentKey
			? apiRoutes.vendorProposalDocumentFile.path.replace(":id", String(p.id))
			: null,
		submittedAt: iso(p.submittedAt),
		tenderStatus: tender.status,
		tenderDeadlineAt: iso(tender.deadlineAt),
	};
}

// ── proposals ─────────────────────────────────────────────
export async function listVendorProposals(
	db: GreenShiftDb,
	userId: number,
	limit: number,
): Promise<ProposalSummary[]> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return [];

	const rows = await repository.listProposalRows(db, vendorId, limit);

	return rows.map(({ proposal, tender, project }) =>
		proposalSummary(proposal, project, tender),
	);
}

export async function getVendorProposal(
	db: GreenShiftDb,
	userId: number,
	proposalId: number,
): Promise<ProposalDetail | null> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return null;

	return getProposalDetail(db, proposalId, vendorId);
}

export interface SubmitProposalInput {
	tenderId: number;
	amount: number;
	technicalSpec?: string;
	operationalCost?: number;
	projectedRoi?: number;
	warrantyPeriod?: number;
	/** The proposal document. Required: a bid is filed with the case for it. */
	file: File;
}

export type SubmitProposalResult =
	| { status: "ok"; proposal: ProposalSummary }
	| { status: "no_profile" }
	| { status: "unverified" }
	| { status: "tender_not_found" }
	| { status: "tender_closed" }
	| { status: "not_invited" }
	| { status: "deadline_passed" }
	| { status: "duplicate" }
	| { status: "conflict" }
	| { status: "load_failed" };

/**
 * Files a bid: the document goes to R2 first and the row is written with it, so
 * the bid exists complete or not at all. A write that does not land (the tender
 * closed in between, or the vendor bid twice) takes the object back with it.
 */
export async function submitProposal(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	input: SubmitProposalInput,
): Promise<SubmitProposalResult> {
	const profile = await repository.findVendorByUser(db, userId);
	if (!profile) return { status: "no_profile" };
	if (!profile.verifiedAt) return { status: "unverified" };

	const tender = await repository.findTenderById(db, input.tenderId);
	if (!tender) return { status: "tender_not_found" };
	if (tender.status !== "open") return { status: "tender_closed" };
	// A closed or direct tender is bid on by invitation only: a vendor that was
	// never put forward for this project cannot bid on it, whatever it guesses.
	if (
		!(await isTenderVisibleTo(db, tender.projectId, profile.id, tender.method))
	) {
		return { status: "not_invited" };
	}
	if (tender.deadlineAt && tender.deadlineAt.getTime() < Date.now()) {
		return { status: "deadline_passed" };
	}

	const duplicate = await repository.findProposalIdByTenderVendor(
		db,
		input.tenderId,
		profile.id,
	);
	if (duplicate) return { status: "duplicate" };

	const documentKey = `vendor-proposals/${profile.id}/${crypto.randomUUID()}/${input.file.name}`;
	await env.R2.put(documentKey, await input.file.arrayBuffer(), {
		httpMetadata: { contentType: "application/pdf" },
	});

	const inserted = await repository.insertProposalAtomically(db, {
		tenderId: input.tenderId,
		vendorId: profile.id,
		amount: input.amount,
		technicalSpec: input.technicalSpec,
		operationalCost: input.operationalCost,
		projectedRoi: input.projectedRoi,
		warrantyPeriod: input.warrantyPeriod,
		documentName: input.file.name,
		documentKey,
	});
	if (!inserted) {
		await env.R2.delete(documentKey);
		return { status: "conflict" };
	}

	await recordAudit(db, {
		userId,
		projectId: tender.projectId,
		action: "proposal.submitted",
		entityType: "proposal",
		entityId: inserted.id,
		metadata: {
			amount: input.amount,
			tenderId: input.tenderId,
			documentName: input.file.name,
		},
	});

	const row = await repository.findProposalSummaryRow(db, inserted.id);
	if (!row) return { status: "load_failed" };

	return {
		status: "ok",
		proposal: proposalSummary(row.proposal, row.project, row.tender),
	};
}

export type WithdrawProposalResult =
	| { status: "ok" }
	| { status: "not_found" }
	| { status: "locked" };

/** The proposal document: a PDF the bidder files with the bid. 10 MB is generous. */
export const MAX_PROPOSAL_DOCUMENT_BYTES = 10 * 1024 * 1024;

/**
 * A proposal document is a PDF, and only a PDF: it is the bid's written case, and
 * the company reads it in the browser's own viewer.
 */
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

/**
 * Files the proposal PDF on one of the vendor's own bids. The row is written
 * before the object is replaced, so a failed write leaves the previous document
 * in place rather than a key pointing at nothing.
 */
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

	const updated = await repository.setProposalDocument(
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

export type ProposalDocumentStream =
	| {
			outcome: "ok";
			body: ReadableStream;
			contentType: string;
			fileName: string;
	  }
	| { outcome: "not_found" };

/** The filed document for one of the vendor's own bids, ready to stream. */
export async function readVendorProposalDocument(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	proposalId: number,
): Promise<ProposalDocumentStream> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { outcome: "not_found" };

	const row = await repository.findVendorProposalDocument(
		db,
		proposalId,
		vendorId,
	);
	return streamDocument(env, row);
}

/**
 * The same document as the company that owns the project reads it: the bidder's
 * written case is part of what the company evaluates, so it is readable on the
 * company's side of the tender and by nobody else.
 */
export async function readProjectProposalDocument(
	db: GreenShiftDb,
	env: Env,
	projectId: number,
	proposalId: number,
): Promise<ProposalDocumentStream> {
	const row = await repository.findProjectProposalDocument(
		db,
		proposalId,
		projectId,
	);
	return streamDocument(env, row);
}

/** One document row out of R2, or not found when there is no file to serve. */
async function streamDocument(
	env: Env,
	row: { documentName: string | null; documentKey: string | null } | null,
): Promise<ProposalDocumentStream> {
	if (!row?.documentKey) return { outcome: "not_found" };

	const object = await env.R2.get(row.documentKey);
	if (!object) return { outcome: "not_found" };

	return {
		outcome: "ok",
		body: object.body,
		contentType: "application/pdf",
		fileName: row.documentName ?? "proposal.pdf",
	};
}

// Withdraw: allowed only while the proposal is still queued for review.
export async function withdrawVendorProposal(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	proposalId: number,
): Promise<WithdrawProposalResult> {
	const vendorId = await vendorProfileId(db, userId);
	if (vendorId === null) return { status: "not_found" };

	const row = await repository.findProposalWithTender(db, proposalId, vendorId);
	if (!row) return { status: "not_found" };

	if (row.proposal.status !== "submitted") return { status: "locked" };

	await repository.withdrawProposalWithAudit(db, {
		proposalId,
		userId,
		projectId: row.tender.projectId,
		amount: row.proposal.amount,
	});
	// The row is the source of truth: an object left behind with no row is
	// unreachable, so the filed document goes with the bid.
	if (row.proposal.documentKey) {
		await env.R2.delete(row.proposal.documentKey);
	}
	return { status: "ok" };
}
