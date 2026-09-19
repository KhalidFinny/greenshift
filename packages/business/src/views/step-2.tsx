import {
	faCloudArrowUp,
	faFileLines,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { useRef } from "react";
import type { CreditScoreResult } from "../lib/credit-score";
import type { WizardForm } from "../lib/use-project-wizard-form";
import { step2Validator } from "../lib/wizard-rules";

export const JAMINAN_OPTIONS = [
	"Land or building certificate",
	"Machinery and equipment",
	"Trade receivables",
	"Corporate guarantee / letter of comfort",
] as const;

export interface Step2ViewProps {
	form: WizardForm;
	files: string[];
	onFiles: (files: FileList | null) => void;
	onRemoveFile: (index: number) => void;
	fileError?: string;
	score: CreditScoreResult;
}

export function Step2View({
	form,
	files,
	onFiles,
	onRemoveFile,
	fileError,
	score,
}: Step2ViewProps) {
	const fileRef = useRef<HTMLInputElement | null>(null);

	return (
		<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
			<div className="min-w-0 space-y-8">
				<section className="space-y-4">
					<div>
						<h2 className="text-lg font-semibold">
							A. Project Funding Requirement
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Capital expenditure, tenor, and the estimated annual saving.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<form.AppField
							name="capex"
							validators={{ onChange: step2Validator(form, "capex") }}
						>
							{(field) => (
								<field.NumberField
									label="Total CAPEX"
									prefix="Rp"
									placeholder="4.200.000.000"
								/>
							)}
						</form.AppField>
						<form.AppField
							name="tenor"
							validators={{ onChange: step2Validator(form, "tenor") }}
						>
							{(field) => (
								<field.NumberField
									label="Financing Tenor"
									unit="years"
									inputMode="numeric"
									placeholder="10"
								/>
							)}
						</form.AppField>
						<form.AppField
							name="saving"
							validators={{ onChange: step2Validator(form, "saving") }}
						>
							{(field) => (
								<field.NumberField
									label="Estimated Annual Saving"
									prefix="Rp"
									placeholder="500.000.000"
								/>
							)}
						</form.AppField>
					</div>
				</section>

				<section className="space-y-4">
					<div>
						<h2 className="text-lg font-semibold">
							B. Short Financial Profile
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							The company's repayment capacity and form of collateral.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<form.AppField
							name="pendapatan"
							validators={{ onChange: step2Validator(form, "pendapatan") }}
						>
							{(field) => (
								<field.NumberField
									label="Company Annual Revenue"
									prefix="Rp"
									placeholder="10.000.000.000"
								/>
							)}
						</form.AppField>
						<form.AppField
							name="jaminan"
							validators={{ onChange: step2Validator(form, "jaminan") }}
						>
							{(field) => (
								<field.SelectField
									label="Form of Collateral"
									placeholder="Choose collateral"
									options={JAMINAN_OPTIONS}
								/>
							)}
						</form.AppField>
					</div>
				</section>

				<section className="space-y-4">
					<div>
						<h2 className="text-lg font-semibold">C. Financial Documents</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Financial statements and the cost budget. At least 1 file, saved
							with your draft.
						</p>
					</div>
					<div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
						<FontAwesomeIcon
							icon={faCloudArrowUp}
							className="mx-auto size-5 text-muted-foreground"
						/>
						<p className="mt-2 text-sm font-medium">
							Upload financial statements and the cost budget
						</p>
						<p className="mt-1 text-sm text-muted-foreground">
							{files.length} uploaded · saved with your draft.
						</p>
						{fileError ? (
							<p role="alert" className="mt-2 text-sm text-destructive">
								{fileError}
							</p>
						) : null}
						<input
							ref={fileRef}
							type="file"
							multiple
							className="sr-only"
							aria-label="Upload financial statements and the cost budget"
							onChange={(ev) => onFiles(ev.target.files)}
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => fileRef.current?.click()}
						>
							<FontAwesomeIcon icon={faCloudArrowUp} />
							Choose files
						</Button>
					</div>
					{files.length > 0 ? (
						<ul className="divide-y divide-border">
							{files.map((name, i) => (
								<li
									key={`${name}-${i}`}
									className="flex items-center justify-between gap-3 py-2"
								>
									<div className="flex min-w-0 items-center gap-3">
										<FontAwesomeIcon
											icon={faFileLines}
											className="size-4 shrink-0 text-muted-foreground"
										/>
										<p className="truncate text-sm font-medium">{name}</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										aria-label={`Remove ${name}`}
										onClick={() => onRemoveFile(i)}
									>
										<FontAwesomeIcon icon={faTrash} />
									</Button>
								</li>
							))}
						</ul>
					) : null}
				</section>
			</div>

			<aside className="min-w-0 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Credit Scoring Simulation</CardTitle>
						<CardDescription className="text-sm">
							Derived from the inputs on the left.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{score.score === null || score.rating === null ? (
							<p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
								Not calculated yet. Fill in CAPEX, tenor, and the annual saving.
							</p>
						) : (
							<div className="rounded-lg bg-muted px-4 py-3">
								<p className="text-3xl font-semibold tabular-nums">
									{score.rating}
								</p>
								<p className="mt-1 text-sm tabular-nums text-muted-foreground">
									Score {score.score}/100
								</p>
								<div
									role="progressbar"
									aria-valuenow={score.score}
									aria-valuemin={0}
									aria-valuemax={100}
									aria-label="Credit score"
									className="mt-3 h-2 overflow-hidden rounded-full bg-background"
								>
									<div
										className="h-full rounded-full bg-primary"
										style={{ width: `${score.score}%` }}
									/>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</aside>
		</div>
	);
}
