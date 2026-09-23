/* The wizard's chrome for the active step: the sticky bar with the step strip, the
 * autosave line and the actions, then the step's purpose and the invalid-field banner. */

import { Button, cn } from "@greenshift/ui";
import type { SaveState } from "../lib/use-business-draft";

/* The step circles share one ramp. A state adds to it and never cancels it. */
const STEP_CIRCLE =
	"flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums sm:size-8";

/* Only a completed step is clickable, so the interactive classes live here. */
const STEP_LINK = cn(
	STEP_CIRCLE,
	"outline-none transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring",
);

const STEP_STATE = {
	active: "bg-primary text-primary-foreground",
	completed: "border border-primary/40 bg-primary/10 text-primary",
	upcoming: "border border-border bg-muted text-muted-foreground",
} as const;

/* The COMPANY names from the glossary, which supersede the old step 1-internal names. */
const STEPS = [
	"Project Profile",
	"Financial Eligibility",
	"Scope of Work",
	"Review & Submit",
];

/* One line of orientation for the step the user is on, on the page rather than the bar. */
const STEP_SUBTITLES = [
	"Base energy data and the goal of the project. Step 1 of 4.",
	"The funding need and the repayment capacity. Step 2 of 4.",
	"The key technical requirements and the deliverables a bidder is measured against. Step 3 of 4.",
	"Check the summary and file the project. Step 4 of 4.",
];

/** The autosave line, empty until the first save is about to happen. */
function saveLabel(state: SaveState, loading: boolean): string {
	if (loading) return "Opening your draft…";
	switch (state) {
		case "saving":
			return "Saving…";
		case "saved":
			return "Draft saved.";
		case "failed":
			return "Not saved. Retrying; your work stays in this tab.";
		default:
			return "";
	}
}

export interface WizardHeaderProps {
	activeStep: number;
	saveState: SaveState;
	loading: boolean;
	submitting: boolean;
	/** Both declarations ticked, so the last step may submit. */
	canSubmit: boolean;
	/** A completed step, which is the only kind the strip lets the user open. */
	onStep: (step: number) => void;
	onBack: () => void;
	onNext: () => void;
	onSubmit: () => void;
}

export function WizardHeader({
	activeStep,
	saveState,
	loading,
	submitting,
	canSubmit,
	onStep,
	onBack,
	onNext,
	onSubmit,
}: WizardHeaderProps) {
	const lastStep = activeStep === STEPS.length - 1;

	return (
		<>
			{/* The wizard's own header, and the only sticky element: the strip and the
			    actions share a row while they fit, and wrap when they do not. */}
			<header className="sticky top-0 z-20 -mx-4 border-b border-border bg-background px-4 py-2 sm:-mx-6 sm:px-6">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
					<ol
						aria-label="Submission steps"
						className="relative flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-x-5"
					>
						{STEPS.map((step, i) => {
							const active = i === activeStep;
							const completed = i < activeStep;
							return (
								<li
									key={step}
									className={cn(
										"relative flex min-w-0 items-center gap-1.5",
										// A segment in the gap to the next step, at the circles' centre line,
										// rather than one rail behind all of them; its insets match the gap either side.
										i < STEPS.length - 1 &&
											"after:absolute after:top-1/2 after:left-[calc(100%+2px)] after:h-px after:w-2 after:-translate-y-1/2 after:bg-border sm:after:left-[calc(100%+4px)] sm:after:w-3",
									)}
								>
									{completed ? (
										<button
											type="button"
											onClick={() => onStep(i)}
											aria-label={`Go back to step ${i + 1}: ${step}`}
											className={cn(STEP_LINK, STEP_STATE.completed)}
										>
											{`0${i + 1}`}
										</button>
									) : (
										<span
											aria-current={active ? "step" : undefined}
											className={cn(
												STEP_CIRCLE,
												active ? STEP_STATE.active : STEP_STATE.upcoming,
											)}
										>
											{`0${i + 1}`}
										</span>
									)}
									<span
										className={cn(
											"hidden truncate text-sm sm:inline",
											active ? "font-semibold" : "text-muted-foreground",
										)}
									>
										{step}
									</span>
								</li>
							);
						})}
					</ol>
					{/* Four names do not fit on a phone line, so the active one is named beside the numbers. */}
					<span className="truncate text-sm font-semibold sm:hidden">
						{STEPS[activeStep]}
					</span>
					<div className="ml-auto flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
						<output
							className={cn(
								"min-w-0 text-sm",
								saveState === "failed"
									? "text-destructive"
									: "text-muted-foreground",
							)}
						>
							{saveLabel(saveState, loading)}
						</output>
						<div className="flex shrink-0 items-center gap-2">
							<Button
								type="button"
								variant="secondary"
								disabled={activeStep === 0}
								onClick={onBack}
							>
								Back
							</Button>
							{lastStep ? (
								<Button
									type="button"
									disabled={!canSubmit || submitting}
									onClick={onSubmit}
								>
									Submit the Project
								</Button>
							) : (
								<Button type="button" onClick={onNext}>
									Save &amp; continue
								</Button>
							)}
						</div>
					</div>
				</div>
			</header>

			{/* The bar carries the step's name, so the page carries its purpose. */}
			<p className="text-sm text-muted-foreground">
				{STEP_SUBTITLES[activeStep]}
			</p>
		</>
	);
}
