/* The wizard's last step: the review the user submits on. The summary is the same
 * `ProjectSummary` the project page renders; only the declarations belong to the wizard. */

import { parseIdNumber } from "../../lib/number-format";
import type { ProjectFunding } from "../../lib/project-funding";
import type { ProjectRiskResult } from "../../lib/project-risk";
import type { WizardForm } from "../../lib/use-project-wizard-form";
import { ProjectSummary, type SummaryDocumentRow } from "./project-summary";

/* The two statements submit is gated on, in the order the form holds them. */
const DECLARATIONS = [
	{
		field: "consent",
		label:
			"I agree that the project data may be used for the Green Bond issuance.",
		description:
			"Covers the project data, the uploaded documents, and the risk assessment derived from them.",
	},
	{
		field: "declaration",
		label: "I confirm the data I entered is accurate and can be verified.",
		description:
			"Figures and documents are checked against this statement during the initial review.",
	},
] as const;

export interface Step1Summary {
	namaProyek: string;
	lokasi: string;
	sektor: string;
}

export interface Step2Summary {
	capex: string;
	tenor: string;
	saving: string;
	pendapatan: string;
	jaminan: string;
}

export interface Step3Summary {
	requirements: string[];
	deliverables: string[];
}

export interface ReviewViewProps {
	form: WizardForm;
	step1: Step1Summary;
	step2: Step2Summary;
	step3: Step3Summary;
	step1Docs: { id: string; label: string; name?: string }[];
	risk: ProjectRiskResult | null;
}

function fundingFrom(step2: Step2Summary): ProjectFunding {
	return {
		capexRp: parseIdNumber(step2.capex),
		tenorTahun: parseIdNumber(step2.tenor),
		penghematanRp: parseIdNumber(step2.saving),
		pendapatanRp: parseIdNumber(step2.pendapatan),
	};
}

export function ReviewView(props: ReviewViewProps) {
	const { form, step1, step2, step3, step1Docs, risk } = props;

	/* The project's own documents: what the money figures were read from, and what a
	   bidder reads with the tender. The LVV's pack is filed at Sistem Registri. */
	const step1Rows: SummaryDocumentRow[] = step1Docs.map((doc) => ({
		id: doc.id,
		label: doc.label,
		name: doc.name,
	}));

	return (
		<div className="space-y-10">
			<ProjectSummary
				context="review"
				funding={fundingFrom(step2)}
				project={{
					namaProyek: step1.namaProyek,
					lokasi: step1.lokasi,
					sektor: step1.sektor,
					jaminan: step2.jaminan.trim() ? step2.jaminan : null,
				}}
				scope={step3}
				risk={risk}
				vendorDocs={step1Rows}
			/>

			<section className="space-y-4">
				<div className="border-b border-border pb-3">
					<h2 className="text-lg font-semibold">
						E. Declaration &amp; Manual Verification
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Submitting this project puts it on record with GreenShift. Agree to
						both terms below, or submit stays disabled.
					</p>
				</div>
				<ol className="divide-y divide-border border-y border-border">
					{DECLARATIONS.map((declaration, index) => (
						<li key={declaration.field} className="flex items-start gap-4 py-4">
							<span
								aria-hidden
								className="mt-0.5 w-4 shrink-0 text-sm tabular-nums text-muted-foreground"
							>
								{index + 1}
							</span>
							<form.AppField name={declaration.field}>
								{(field) => (
									<field.CheckboxField
										label={declaration.label}
										description={declaration.description}
									/>
								)}
							</form.AppField>
						</li>
					))}
				</ol>

				{/* What pressing Submit does, in the order it happens. */}
				<div className="rounded-xl border border-border bg-muted/50 px-5 py-4">
					<p className="text-sm font-semibold">What happens after you submit</p>
					<p className="mt-1.5 text-sm leading-6">
						The project is filed with its summary, its documents and its risk
						assessment. Register it at Sistem Registri and appoint the LVV body
						that verifies it: verification starts from the project's own page,
						and a verified project goes on to vendor matchmaking.
					</p>
				</div>
			</section>
		</div>
	);
}
