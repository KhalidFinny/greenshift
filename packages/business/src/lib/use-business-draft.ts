import {
	api,
	type BusinessDraftDocument,
	type BusinessStep1,
	type BusinessStep1Patch,
	type BusinessStep2,
	type BusinessStep2Patch,
	type BusinessStep3,
	type BusinessSubmittedProject,
} from "@greenshift/core";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The wizard's draft: identity, autosave and submission.
 *
 * The draft id lives in `localStorage` so a refresh resumes the same draft
 * instead of starting a second one. Autosave is debounced and suppressed until
 * the resume has been applied, otherwise seeding the form from the server would
 * immediately save the empty state back over it.
 */

const DRAFT_KEY = "greenshift.business.draftId";
const AUTOSAVE_DELAY_MS = 800;
/** Bounded, so an endpoint that keeps failing cannot be hammered. */
const SAVE_RETRIES = 2;
const SAVE_RETRY_MS = 3000;

/** `setTimeout`'s handle is a number in the browser and an object under SSR. */
type TimerHandle = ReturnType<typeof setTimeout>;

/** The body of one autosave: the step being edited plus that step's block. */
export type DraftStepBody = {
	step: 1 | 2 | 3;
	step1?: Step1Patch;
	step2?: Step2Patch;
	step3?: BusinessStep3;
};

/** What the last autosave did. `idle` means nothing has been sent yet. */
export type SaveState = "idle" | "saving" | "saved" | "failed";

/**
 * A partial block: only the fields the user has touched. A key present with
 * `null` means the field was cleared, which is how the server reads it too.
 */
export type Step1Patch = BusinessStep1Patch;
export type Step2Patch = BusinessStep2Patch;

export interface DraftResume {
	step1: Step1Patch | null;
	step2: Step2Patch | null;
	step3: BusinessStep3 | null;
	/** The draft's files, which its blocks reference only by id. */
	documents: BusinessDraftDocument[];
	step: number | null;
}

export interface UseBusinessDraftResult {
	/** True until the stored draft has been read (or found absent). */
	loading: boolean;
	/** What the last autosave did, so the wizard can show it. */
	saveState: SaveState;
	/** Persists the current step's block, debounced. */
	saveStep: (body: DraftStepBody) => void;
	/**
	 * Uploads one wizard file and returns its document id, or null on failure.
	 * Bound to the hook's own draft, so callers never pass the id around.
	 */
	uploadDocument: (file: File, slot: string) => Promise<string | null>;
	/** Removes an uploaded file from the draft. */
	removeDocument: (docId: string) => Promise<void>;
	/** Submits the draft. Resolves to the created project, or null on failure. */
	submit: (body: {
		step1: BusinessStep1;
		step2: BusinessStep2;
		step3: BusinessStep3;
		consent: boolean;
		declaration: boolean;
	}) => Promise<BusinessSubmittedProject | null>;
	submitting: boolean;
}

function readStoredId(): string | null {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(DRAFT_KEY);
}

function newDraftId(): string {
	return `draft_${crypto.randomUUID()}`;
}

export function useBusinessDraft(
	onResume: (resume: DraftResume) => void,
): UseBusinessDraftResult {
	const [draftId, setDraftId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [saveState, setSaveState] = useState<SaveState>("idle");
	const [submitting, setSubmitting] = useState(false);

	/** Guards autosave against writing the form back before it is seeded. */
	const resumed = useRef(false);
	const timer = useRef<TimerHandle | undefined>(undefined);
	const pending = useRef<DraftStepBody | null>(null);
	/** The last payload the server accepted, so an unchanged one is not resent. */
	const written = useRef<string | null>(null);
	const attempts = useRef(0);
	const retry = useRef<TimerHandle | undefined>(undefined);
	// The resume callback is called once; keeping it in a ref means an inline
	// callback from the caller does not restart the load effect every render.
	const onResumeRef = useRef(onResume);
	onResumeRef.current = onResume;

	useEffect(() => {
		let cancelled = false;
		const stored = readStoredId();
		const id = stored ?? newDraftId();
		if (!stored) window.localStorage.setItem(DRAFT_KEY, id);
		setDraftId(id);

		/**
		 * Hands the stored draft to the caller's resume callback.
		 *
		 * A read that fails means the draft was never saved yet, which is a new
		 * project rather than an error. A callback that throws is a different thing:
		 * it is a bug in the seeding, so it must not be read as an empty draft, and
		 * autosave stays off rather than writing blanks over what the server holds.
		 */
		async function resume(id: string): Promise<void> {
			let storedDraft: DraftResume | null = null;
			try {
				const { draft, documents } = await api.business.draft(id);
				storedDraft = {
					step1: draft.step1 ?? null,
					step2: draft.step2 ?? null,
					step3: draft.step3 ?? null,
					documents,
					step: draft.step,
				};
			} catch {
				// No stored draft: carry on with an empty form.
			}
			if (cancelled) return;
			if (storedDraft) onResumeRef.current(storedDraft);
			// Armed either way: with nothing stored, the empty form is the truth.
			resumed.current = true;
		}

		void resume(id)
			.catch((error) => {
				// `resumed` is still false, so this costs the session's autosave
				// rather than the stored draft.
				console.error("[draft] resume failed, autosave stays off", error);
			})
			.finally(() => {
				if (cancelled) return;
				setLoading(false);
			});

		return () => {
			cancelled = true;
			clearTimeout(timer.current);
			clearTimeout(retry.current);
		};
	}, []);

	const send = useCallback(
		async (body: DraftStepBody) => {
			if (!draftId) return;
			const payload = JSON.stringify(body);
			// The caller's effect runs per keystroke, and the debounce still lands
			// on payloads the server already has. Resending them only spends the
			// mutation budget that the retry below needs.
			if (payload === written.current) return;
			setSaveState("saving");
			try {
				await api.business.saveDraft(draftId, body);
				written.current = payload;
				attempts.current = 0;
				setSaveState("saved");
			} catch {
				// A silent failure is worse than no autosave: the user stops
				// worrying about a draft that is not being written.
				setSaveState("failed");
				attempts.current += 1;
				if (attempts.current <= SAVE_RETRIES) {
					retry.current = setTimeout(
						() => void send(body),
						SAVE_RETRY_MS * attempts.current,
					);
				}
			}
		},
		[draftId],
	);

	const flush = useCallback(() => {
		const body = pending.current;
		if (!body || !draftId) return;
		pending.current = null;
		clearTimeout(retry.current);
		void send(body);
	}, [draftId, send]);

	const saveStep = useCallback<UseBusinessDraftResult["saveStep"]>(
		(body) => {
			if (!resumed.current || !draftId) return;
			pending.current = { ...pending.current, ...body };
			clearTimeout(timer.current);
			timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
		},
		[draftId, flush],
	);

	const uploadDocument = useCallback<UseBusinessDraftResult["uploadDocument"]>(
		async (file, slot) => {
			if (!draftId) return null;
			try {
				const { document } = await api.business.uploadDocument(
					draftId,
					file,
					slot,
				);
				return document.id;
			} catch {
				// Already toasted by the client.
				return null;
			}
		},
		[draftId],
	);

	const removeDocument = useCallback<UseBusinessDraftResult["removeDocument"]>(
		async (docId) => {
			if (!draftId) return;
			try {
				await api.business.deleteDocument(draftId, docId);
			} catch {
				// Already toasted by the client.
			}
		},
		[draftId],
	);

	const submit = useCallback<UseBusinessDraftResult["submit"]>(
		async (body) => {
			if (!draftId) return null;
			// Any pending autosave is discarded: submit carries the whole draft.
			clearTimeout(timer.current);
			pending.current = null;

			setSubmitting(true);
			try {
				const { project } = await api.business.submit({
					draftId,
					...body,
				});
				// The draft is consumed, so the next project starts a fresh one.
				window.localStorage.removeItem(DRAFT_KEY);
				setDraftId(null);
				return project;
			} catch {
				// Already toasted by the client, including the per-field detail.
				return null;
			} finally {
				setSubmitting(false);
			}
		},
		[draftId],
	);

	return {
		loading,
		removeDocument,
		saveStep,
		saveState,
		submit,
		submitting,
		uploadDocument,
	};
}
