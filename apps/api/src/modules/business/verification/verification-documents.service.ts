// The certificate files behind the pack: filing, removing and streaming them.

import type { CompanyVerification } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import {
	isAcceptedDocument,
	MAX_DOCUMENT_BYTES,
} from "../../../lib/document-upload";
import * as repository from "./verification.repository";
import {
	isCompanyDocumentSlot,
	readCompanyVerification,
} from "./verification-pack.service";

export type AttachDocumentResult =
	| { status: "ok"; verification: CompanyVerification }
	| { status: "not_found" }
	| { status: "verified" }
	| { status: "too_large" }
	| { status: "unsupported" }
	| { status: "bad_slot" };

// The row is written before the object, so a failed write cannot leave a key pointing at nothing.
export async function attachCompanyDocument(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	slot: string,
	file: File,
): Promise<AttachDocumentResult> {
	if (!isCompanyDocumentSlot(slot)) return { status: "bad_slot" };

	const account = await repository.findAccount(db, userId);
	if (!account) return { status: "not_found" };
	if (account.verifiedAt !== null) return { status: "verified" };

	if (file.size > MAX_DOCUMENT_BYTES) return { status: "too_large" };
	if (!isAcceptedDocument(file)) return { status: "unsupported" };

	const fileKey = `company-documents/${userId}/${slot}/${file.name}`;
	await env.R2.put(fileKey, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type || "application/octet-stream" },
	});

	const { row, previous } = await repository.upsertCompanyDocument(db, {
		userId,
		slot,
		fileName: file.name,
		fileKey,
		contentType: file.type || null,
		sizeBytes: file.size,
	});
	if (!row) {
		await env.R2.delete(fileKey);
		return { status: "not_found" };
	}

	if (previous && previous.fileKey !== fileKey) {
		await env.R2.delete(previous.fileKey);
	}

	const verification = await readCompanyVerification(db, userId);
	return verification
		? { status: "ok", verification }
		: { status: "not_found" };
}

export type RemoveDocumentResult =
	| { status: "ok"; verification: CompanyVerification }
	| { status: "not_found" }
	| { status: "verified" };

export async function removeCompanyDocument(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	slot: string,
): Promise<RemoveDocumentResult> {
	if (!isCompanyDocumentSlot(slot)) return { status: "not_found" };

	const account = await repository.findAccount(db, userId);
	if (!account) return { status: "not_found" };
	if (account.verifiedAt !== null) return { status: "verified" };

	const removed = await repository.deleteCompanyDocument(db, userId, slot);
	if (!removed) return { status: "not_found" };
	await env.R2.delete(removed.fileKey);

	const verification = await readCompanyVerification(db, userId);
	return verification
		? { status: "ok", verification }
		: { status: "not_found" };
}

export type CompanyDocumentStream =
	| {
			outcome: "ok";
			body: ReadableStream;
			contentType: string;
			fileName: string;
	  }
	| { outcome: "not_found" };

export async function readCompanyDocument(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	slot: string,
): Promise<CompanyDocumentStream> {
	if (!isCompanyDocumentSlot(slot)) return { outcome: "not_found" };

	const row = await repository.findCompanyDocument(db, userId, slot);
	if (!row) return { outcome: "not_found" };

	const object = await env.R2.get(row.fileKey);
	if (!object) return { outcome: "not_found" };

	return {
		outcome: "ok",
		body: object.body,
		contentType:
			object.httpMetadata?.contentType ??
			row.contentType ??
			"application/octet-stream",
		fileName: row.fileName,
	};
}

// The reviewer reads the file filed against the account under review, and nothing else.
export async function readCompanyDocumentForAdmin(
	db: GreenShiftDb,
	env: Env,
	accountId: number,
	slot: string,
): Promise<CompanyDocumentStream> {
	return readCompanyDocument(db, env, accountId, slot);
}
