import { useStore, useToast } from "@greenshift/ui";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { creditScore, STEP2_DOC_TARGET } from "../lib/credit-score";
import { parseIdNumber } from "../lib/number-format";
import { projectRisk, step1RiskTones } from "../lib/project-risk";
import { useBusinessDraft } from "../lib/use-business-draft";
import { useProjectWizardForm } from "../lib/use-project-wizard-form";
import { validateStep1, validateStep2, validateStep3 } from "../lib/validators";
import {
	resumeFiles,
	resumeValues,
	slotFiles,
	step1Patch,
	step2Patch,
	step3Patch,
	type WizardFile,
} from "../lib/wizard-payload";
import { step1Values, step2Values, step3Values } from "../lib/wizard-rules";
import { ReviewView } from "../organisms/wizard/review";
import { REQUIRED_DOCS, Step1View } from "../organisms/wizard/step-1";
import { Step2View } from "../organisms/wizard/step-2";
import { Step3View } from "../organisms/wizard/step-3";
import { WizardHeader } from "../organisms/wizard/wizard-header";

const STEP1_SLOT_IDS = REQUIRED_DOCS.map((doc) => doc.id);

export function BusinessSubmit() {
	const form = useProjectWizardForm();
	const values = useStore(form.store, (state) => state.values);
	const { toast } = useToast();
	const navigate = useNavigate();

	const [activeStep, setActiveStep] = useState(0);
	const [step2Attempted, setStep2Attempted] = useState(false);
	const [uploaded, setUploaded] = useState<Record<string, string>>({});
	const [uploadedIds, setUploadedIds] = useState<Record<string, string>>({});

	// One list: an upload and its id appear and disappear together.
	const [finFiles, setFinFiles] = useState<WizardFile[]>([]);
	const finFileIds = useMemo(() => finFiles.map((file) => file.id), [finFiles]);

	const readyToSave = useRef(false);
	const draft = useBusinessDraft((resume) => {
		// useForm re-applies blank defaultValues while untouched, so seeded values must not become defaults.
		form.reset(resumeValues(resume), { keepDefaultValues: true });

		// Blocks hold file ids, so a resumed step needs the resume list to name its files.
		const files = resumeFiles(resume.documents, resume.step2?.fileIds ?? []);
		const step1Files = slotFiles(files.bySlot, STEP1_SLOT_IDS);
		setFinFiles(files.step2);
		setUploaded(step1Files.names);
		setUploadedIds(step1Files.ids);

		if (resume.step != null && resume.step > 1) {
			setActiveStep(Math.min(resume.step, 3) - 1);
		}
		readyToSave.current = true;
	});

	useEffect(() => {
		if (!draft.loading) readyToSave.current = true;
	}, [draft.loading]);

	const draftStep: 1 | 2 | 3 | 4 = (activeStep + 1) as 1 | 2 | 3 | 4;

	// Built from live values at call time: a snapshot in an effect misses later edits and can null out a stored value.
	const saveDraft = useCallback(() => {
		// A blank patch written before resume would overwrite a draft that already has data.
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
		// Step 4 holds no block: uploads are stored as they happen.
		draft.saveStep({ step: 4 });
	}, [draft.saveStep, draftStep, finFileIds]);

	useEffect(() => {
		const subscription = form.store.subscribe(saveDraft);
		return () => subscription.unsubscribe();
	}, [form, saveDraft]);

	// An upload changes no form value, so the new file list nudges the same save.
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
		docsDone: finFileIds.length,
		docsTotal: STEP2_DOC_TARGET,
	});

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

	// One map drives field messages, the step gate and the banner count, so they cannot disagree.
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

	// The server revalidates and scores the draft: nothing here decides the outcome.
	async function handleSubmitProject() {
		// Rules re-run so a missing value fails here instead of being sent as a zero.
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

		if (project) {
			void navigate({
				to: "/business/submitted/$projectId",
				params: { projectId: String(project.id) },
			});
		}
	}

	return (
		// Cancels the shell wrapper's pt-6/pt-8 so the bar stays flush under the header.
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
