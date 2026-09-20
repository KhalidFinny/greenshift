import type {
	BusinessDraft,
	BusinessDraftBody,
	BusinessDraftDocument,
	BusinessStep1Patch,
	BusinessStep2Patch,
	BusinessStep3,
} from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import {
	draftDocumentEntry,
	draftEntry,
	readPayload,
} from "../business.shared";
import {
	type FieldErrors,
	step1Errors,
	step2Errors,
} from "../business.validation";
import * as repository from "./drafts.repository";

/** Message for a `fileId` that is not attached to the draft being written. */
const UNKNOWN_FILE = "This document is not attached to the draft.";

export type DraftResult =
	| { outcome: "ok"; draft: BusinessDraft }
	| { outcome: "not_found" }
	| { outcome: "invalid"; fields: FieldErrors };

/**
 * A resume returns the draft with the files attached to it, or reports it
 * missing. It never validates: the draft's blocks reference those files by id,
 * so without them a resumed step can only show the ids it cannot name.
 */
export type LoadDraftResult =
	| { outcome: "ok"; draft: BusinessDraft; documents: BusinessDraftDocument[] }
	| { outcome: "not_found" };

/**
 * Every `fileId` the payload references, from Step 2's list and Step 3's slots.
 * De-duplicated, because one upload can legitimately appear in both and the
 * caller compares the count with the number of rows found.
 */
function referencedFileIds(body: BusinessDraftBody): string[] {
	const ids = new Set<string>();
	for (const id of body.step2?.fileIds ?? []) {
		if (typeof id === "string") ids.add(id);
	}
	for (const id of Object.values(body.step3?.docStates ?? {})) {
		if (typeof id === "string") ids.add(id);
	}
	return [...ids];
}

/**
 * Merges one autosave into the stored draft.
 *
 * An absent key means the field was untouched and an explicit null means it was
 * cleared, which is why the patch is spread over the stored block rather than
 * replacing it. Validation runs against the patch only: a draft is allowed to
 * be incomplete, and refusing a partial save would make autosave useless.
 */
export async function saveDraft(
	db: GreenShiftDb,
	companyId: number,
	draftId: string,
	body: BusinessDraftBody,
): Promise<DraftResult> {
	const existing = await repository.findDraft(db, draftId, companyId);

	// A draft that exists but belongs to another company is reported as missing
	// rather than forbidden, so the id cannot be probed for existence.
	if (!existing && (await repository.draftIdExists(db, draftId))) {
		return { outcome: "not_found" };
	}

	const fields: FieldErrors = {
		...step1Errors(body.step1 ?? {}, true),
		...step2Errors(body.step2 ?? {}, true),
	};

	const fileIds = referencedFileIds(body);
	if (fileIds.length > 0) {
		const owned = await repository.countOwnedDocuments(db, draftId, fileIds);
		if (owned !== fileIds.length) fields.fileIds = UNKNOWN_FILE;
	}

	if (Object.keys(fields).length > 0) {
		return { outcome: "invalid", fields };
	}

	const previous = readPayload(existing?.payload);
	const step1: BusinessStep1Patch | null = body.step1
		? { ...(previous.step1 ?? {}), ...body.step1 }
		: (previous.step1 ?? null);
	const step2: BusinessStep2Patch | null = body.step2
		? { ...(previous.step2 ?? {}), ...body.step2 }
		: (previous.step2 ?? null);
	// Step 3 carries one nested map, so its slots merge too: sending a single
	// slot must not wipe the rest of the checklist.
	const step3: BusinessStep3 | null = body.step3
		? {
				docStates: {
					...(previous.step3?.docStates ?? {}),
					...body.step3.docStates,
				},
			}
		: (previous.step3 ?? null);

	// Stored as a plain JSON record; `readPayload` gives it its shape back.
	const payload: Record<string, unknown> = { step1, step2, step3 };

	const row = await repository.upsertDraft(db, {
		id: draftId,
		companyId,
		payload,
		step: body.step ?? existing?.step ?? 1,
	});

	return { outcome: "ok", draft: draftEntry(row) };
}

/** Resumes a draft with its files, or reports it missing (including another company's). */
export async function loadDraft(
	db: GreenShiftDb,
	companyId: number,
	draftId: string,
): Promise<LoadDraftResult> {
	const row = await repository.findDraft(db, draftId, companyId);
	if (!row) return { outcome: "not_found" };

	const files = await repository.listDraftDocuments(db, draftId);

	return {
		outcome: "ok",
		draft: draftEntry(row),
		documents: files.map((file) => draftDocumentEntry(file)),
	};
}
