/* The wizard shell: it owns the four steps' state, the draft (autosave, resume,
 * submit) and the values derived from it. Payload shapes and the models live in `lib/`. */

import { useStore, useToast } from "@greenshift/ui";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { creditScore, STEP2_DOC_TARGET } from "./lib/credit-score";
import { parseIdNumber } from "./lib/number-format";
import { projectRisk, step1RiskTones } from "./lib/project-risk";
import { useBusinessDraft } from "./lib/use-business-draft";
import { useProjectWizardForm } from "./lib/use-project-wizard-form";
import { validateStep1, validateStep2, validateStep3 } from "./lib/validators";
import {
	resumeFiles,
	resumeValues,
	slotFiles,
	step1Patch,
	step2Patch,
	step3Patch,
	type WizardFile,
} from "./lib/wizard-payload";
import { step1Values, step2Values, step3Values } from "./lib/wizard-rules";
import { ReviewView } from "./views/review";
import { REQUIRED_DOCS, Step1View } from "./views/step-1";
import { Step2View } from "./views/step-2";
import { Step3View } from "./views/step-3";
import { WizardHeader } from "./views/wizard-header";

/* The slot vocabulary a resumed file is matched against, taken from the checklist. */
const STEP1_SLOT_IDS = REQUIRED_DOCS.map((doc) => doc.id);

export function BusinessSubmit() {
	const form = useProjectWizardForm();
	const values = useStore(form.store, (state) => state.values);
	const { toast } = useToast();
	const navigate = useNavigate();

	/* ADR-006: shell state (the active step, and whether Save and continue was pressed). */
	const [activeStep, setActiveStep] = useState(0);
	/* Save and continue re-runs the step's rules with their messages on; step 2 also asks its document
	 * count. */
	const [step2Attempted, setStep2Attempted] = useState(false);
	/* Step 1 documents (ADR-003): slot to name shown, slot to document id. Uploads are imperative, not
	 * form fields. */
	const [uploaded, setUploaded] = useState<Record<string, string>>({});
	const [uploadedIds, setUploadedIds] = useState<Record<string, string>>({});

	/* Step 2 documents (ADR-004): one list, since an upload and its id appear and disappear
	 * together. */
	const [finFiles, setFinFiles] = useState<WizardFile[]>([]);
	const finFileIds = useMemo(() => finFiles.map((file) => file.id), [finFiles]);

	/* Draft persistence: a stored draft seeds every step in one reset before autosave
	   arms. Stored files are seeded too: an empty list would detach every upload. */
	const readyToSave = useRef(false);
	const draft = useBusinessDraft((resume) => {
		// `useForm` re-applies the caller's blank `defaultValues` while the form is
		// untouched, so seeded values must not become defaults: `keepDefaultValues` fixes it.
		form.reset(resumeValues(resume), { keepDefaultValues: true });

		// The blocks hold file ids, so the files come from the resume list; otherwise a
		// resumed step would count files it cannot name.
		const files = resumeFiles(resume.documents, resume.step2?.fileIds ?? []);
		const step1Files = slotFiles(files.bySlot, STEP1_SLOT_IDS);
		setFinFiles(files.step2);
		setUploaded(step1Files.names);
		setUploadedIds(step1Files.ids);

		// Four screens, four payload steps: the review is the fourth.
		if (resume.step != null && resume.step > 1) {
			setActiveStep(Math.min(resume.step, 3) - 1);
		}
		// Last statement: autosave may only start once the stored draft is in the form.
		readyToSave.current = true;
	});

	// A draft that was never saved has nothing to wait for, so the load settling arms autosave.
	useEffect(() => {
		if (!draft.loading) readyToSave.current = true;
	}, [draft.loading]);

	const draftStep: 1 | 2 | 3 | 4 = (activeStep + 1) as 1 | 2 | 3 | 4;

	/** One autosave, built from the values the form holds when it is called: a snapshot
	 * taken in an effect misses later edits and can send `null` over a stored value. */
	const saveDraft = useCallback(() => {
		// Nothing may be written before the stored draft is applied: a blank patch would
		// be the last word on a draft that already has data.
		if (!readyToSave.current) return;
		const live = form.state.values;
		if (draftStep === 1) {
			draft.saveStep({ step: 1, step1: step1Patch(live) });
			return;
		}
		if (draftStep === 2) {
			draft.saveStep({ step: 2, step2: step2Patch(live, finFileIds) });
			return;
		}
		if (draftStep === 3) {
			draft.saveStep({ step: 3, step3: step3Patch(live) });
			return;
		}
		// The review step holds no block: uploads are stored as they happen, and the
		// declarations belong to submit.
		draft.saveStep({ step: 4 });
	}, [draft.saveStep, draftStep, finFileIds]);

	// The form's change notification drives autosave; the hook debounces and stays quiet
	// until the resume above has been applied.
	useEffect(() => {
		const subscription = form.store.subscribe(saveDraft);
		return () => subscription.unsubscribe();
	}, [form, saveDraft]);

	// An upload changes no form value, so the new file list nudges the same save; so does
	// landing on a step whose block has not been written yet.
	useEffect(() => {
		saveDraft();
	}, [saveDraft]);

	const konsumsiNum = parseIdNumber(values.konsumsi);
	const biayaNum = parseIdNumber(values.biaya);
	const faktorNum = parseIdNumber(values.faktor);
	const targetNum = parseIdNumber(values.targetPct);
	const targetMwhNum = parseIdNumber(values.targetMwh);
	const capexNum = parseIdNumber(values.capex);
	const tenorNum = parseIdNumber(values.tenor);
	const savingNum = parseIdNumber(values.saving);
	const pendapatanNum = parseIdNumber(values.pendapatan);

	const docsDone = REQUIRED_DOCS.filter((doc) => uploaded[doc.id]).length;
	const timelineMatch = values.timeline.match(/(\d{4})/);

	/* ADR-003: the Step 1 tones are derived from the inputs, never stored. */
	const tones = step1RiskTones({
		biaya: biayaNum,
		konsumsi: konsumsiNum,
		timelineYear: timelineMatch ? Number(timelineMatch[1]) : null,
		docsDone,
		docsTotal: REQUIRED_DOCS.length,
		currentYear: new Date().getFullYear(),
	});

	const score = creditScore({
		capex: capexNum,
		tenor: tenorNum,
		saving: savingNum,
		// The draft's attached documents, which a resume restores by id, names included.
		docsDone: finFileIds.length,
		docsTotal: STEP2_DOC_TARGET,
	});

	/* The review's derived risk (ADR-006.7: Step 1 trio + Step 2 files). */
	const riskDocsDone = docsDone + finFileIds.length;
	const riskDocsTotal = REQUIRED_DOCS.length + STEP2_DOC_TARGET;
	const riskInputsEmpty =
		tones.finansial === null &&
		tones.teknis === null &&
		tones.implementasi === null &&
		score.score === null &&
		riskDocsDone === 0;
	const riskAssessment = riskInputsEmpty
		? null
		: projectRisk({
				finansial: tones.finansial,
				teknis: tones.teknis,
				implementasi: tones.implementasi,
				creditScore: score.score,
				docsDone: riskDocsDone,
				docsTotal: riskDocsTotal,
			});

	/* The step's rules over live values; one map drives field messages, the step gate and
	   the banner count, so they cannot disagree. */
	const step1Messages = validateStep1(step1Values(values));
	const step2Messages = validateStep2(step2Values(values, finFileIds.length));
	const step3Messages = validateStep3(step3Values(values));

	async function handleFile(id: string, file: File | undefined) {
		if (!file) return;
		const docId = await draft.uploadDocument(file, id);
		if (!docId) return;
		setUploaded((prev) => ({ ...prev, [id]: file.name }));
		setUploadedIds((prev) => ({ ...prev, [id]: docId }));
	}

	async function removeStep1Doc(slot: string) {
		const docId = uploadedIds[slot];
		if (docId) await draft.removeDocument(docId);
		setUploaded((prev) => {
			const next = { ...prev };
			delete next[slot];
			return next;
		});
		setUploadedIds((prev) => {
			const next = { ...prev };
			delete next[slot];
			return next;
		});
	}

	async function handleFinFiles(files: FileList | null) {
		if (!files) return;
		for (const file of Array.from(files)) {
			const docId = await draft.uploadDocument(file, "lapkeu");
			if (!docId) continue;
			setFinFiles((prev) => [
				...prev,
				{ id: docId, name: file.name, sizeBytes: file.size },
			]);
		}
	}

	async function removeFinFile(id: string) {
		await draft.removeDocument(id);
		setFinFiles((prev) => prev.filter((file) => file.id !== id));
	}

	/* Shell navigation (ADR-006.1 + 006.6): a step only advances on an empty rule map, so
	   every step behind is a link and every step ahead is inert. */

	/** Says how many fields of the step are still open. */
	function reportStep(messages: Record<string, unknown>) {
		const count = Object.keys(messages).length;
		toast({
			tone: "error",
			title: "This step is not complete",
			message:
				count === 1
					? "1 field still needs an answer. Its message is under the field."
					: `${count} fields still need an answer. Their messages are under the fields.`,
		});
	}

	/** Save and continue: every message the step's rules produce is shown at once, and
	 * the step only advances on an empty map. The refusal itself is a toast. */
	async function handleNext() {
		if (activeStep === 0) {
			await form.validateAllFields("change");
			if (Object.keys(step1Messages).length > 0) {
				reportStep(step1Messages);
				return;
			}
			setActiveStep(1);
			return;
		}
		if (activeStep === 1) {
			setStep2Attempted(true);
			await form.validateAllFields("change");
			if (Object.keys(step2Messages).length > 0) {
				reportStep(step2Messages);
				return;
			}
			setActiveStep(2);
			return;
		}
		if (activeStep === 2) {
			await form.validateAllFields("change");
			if (Object.keys(step3Messages).length > 0) {
				reportStep(step3Messages);
				return;
			}
			setActiveStep(3);
			return;
		}
		setActiveStep(activeStep + 1);
	}

	function handleBack() {
		setActiveStep((step) => Math.max(0, step - 1));
	}

	/** Sends the draft: the server revalidates, scores it and returns the project, so
	 * nothing here decides the outcome. */
	async function handleSubmitProject() {
		// The client rules run again, so a value that went missing fails here instead of
		// being sent as a zero.
		if (
			Object.keys(step1Messages).length > 0 ||
			Object.keys(step2Messages).length > 0 ||
			Object.keys(step3Messages).length > 0
		) {
			return;
		}
		if (
			konsumsiNum === null ||
			biayaNum === null ||
			faktorNum === null ||
			targetNum === null ||
			targetMwhNum === null ||
			capexNum === null ||
			tenorNum === null ||
			savingNum === null ||
			pendapatanNum === null ||
			!values.jaminan
		) {
			return;
		}

		toast({
			tone: "info",
			title: "Submitting",
			message: "Sending the project for verification…",
		});

		const project = await draft.submit({
			step1: {
				namaProyek: values.namaProyek,
				lokasi: values.lokasi,
				sektor: values.sektor,
				konsumsiMwh: konsumsiNum,
				biayaRp: biayaNum,
				faktorEmisi: faktorNum,
				targetPct: targetNum,
				targetMwh: targetMwhNum,
				timeline: values.timeline,
				ringkasan: values.ringkasan,
			},
			step2: {
				capexRp: capexNum,
				tenorTahun: tenorNum,
				penghematanRp: savingNum,
				pendapatanRp: pendapatanNum,
				jaminan: values.jaminan,
				fileIds: finFileIds,
			},
			step3: {
				requirements: step3Values(values).requirements,
				deliverables: step3Values(values).deliverables,
			},
			consent: values.consent,
			declaration: values.declaration,
		});

		// The wizard is finished with: the record it just created is the page.
		if (project) {
			void navigate({
				to: "/business/submitted/$projectId",
				params: { projectId: String(project.id) },
			});
		}
	}

	return (
		/* The shell's content wrapper has no padding, so this root cancels the inner
		   wrapper's pt-6/pt-8 to keep the bar flush under the header while scrolling. */
		<div className="flex flex-col -mt-6 space-y-6 sm:-mt-8 sm:space-y-8">
			<WizardHeader
				activeStep={activeStep}
				canSubmit={values.consent && values.declaration}
				loading={draft.loading}
				saveState={draft.saveState}
				submitting={draft.submitting}
				onBack={handleBack}
				onNext={() => void handleNext()}
				onStep={setActiveStep}
				onSubmit={() => void handleSubmitProject()}
			/>

			{activeStep === 0 && (
				<Step1View
					form={form}
					tones={tones}
					uploaded={uploaded}
					onRemove={(id) => void removeStep1Doc(id)}
					onUpload={(id, file) => void handleFile(id, file)}
				/>
			)}

			{activeStep === 1 && (
				<Step2View
					form={form}
					files={finFiles}
					onFiles={(files) => void handleFinFiles(files)}
					onRemoveFile={(id) => void removeFinFile(id)}
					fileError={step2Attempted ? step2Messages.files : undefined}
					score={score}
				/>
			)}

			{activeStep === 2 && <Step3View form={form} />}

			{activeStep === 3 && (
				<ReviewView
					form={form}
					step1={{
						namaProyek: values.namaProyek,
						lokasi: values.lokasi,
						sektor: values.sektor,
					}}
					step2={{
						capex: values.capex,
						tenor: values.tenor,
						saving: values.saving,
						pendapatan: values.pendapatan,
						jaminan: values.jaminan,
					}}
					step3={{
						requirements: step3Values(values).requirements,
						deliverables: step3Values(values).deliverables,
					}}
					step1Docs={REQUIRED_DOCS.map((doc) => ({
						id: doc.id,
						label: doc.label,
						name: uploaded[doc.id],
					}))}
					risk={riskAssessment}
				/>
			)}
		</div>
	);
}
