import type { ProposalDetail, ProposalSummary } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import { proposalSummary } from "../vendor.proposal";
import { getProposalDetail, vendorProfileId } from "../vendor.shared";
import * as repository from "./proposals.repository";

export {
	type AttachProposalDocumentResult,
	attachProposalDocument,
	isProposalPdf,
	MAX_PROPOSAL_DOCUMENT_BYTES,
} from "./proposals.document.service";
export {
	type SubmitProposalInput,
	type SubmitProposalResult,
	submitProposal,
	type WithdrawProposalResult,
	withdrawVendorProposal,
} from "./proposals.filing.service";

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

/** The same document as the company that owns the project reads it; nobody else reads it. */
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
