/* Step 3 of the wizard: the scope of work the tender is bid against.
 *
 * Both lists are open-ended, because the number of requirements a project has is
 * the project's own rather than a fixed set of fields, so each is one entry per
 * line. What the entries are for is the reason the step exists at all: the key
 * technical requirements are part of the vocabulary the matching model reads, and
 * the deliverables are what every bidder is shown beside the scope of work.
 */

import type { WizardForm } from "../lib/use-project-wizard-form";
import { step3Validator } from "../lib/wizard-rules";

export interface Step3ViewProps {
	form: WizardForm;
}

export function Step3View({ form }: Step3ViewProps) {
	return (
		<div className="space-y-8">
			<section className="space-y-4">
				<div className="border-b border-border pb-3">
					<h2 className="text-lg font-semibold">A. Scope of Work</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						What the tender is bid against. Both lists reach the vendors, so
						write them as the bidder has to read them.
					</p>
				</div>

				<div className="grid gap-6 xl:grid-cols-2">
					<form.AppField
						name="requirements"
						validators={{ onChange: step3Validator(form, "requirements") }}
					>
						{(field) => (
							<field.TextareaField
								label="Key technical requirements"
								description="One per line: the equipment, standards and performance a bidder has to meet. The matching model reads these, so they decide which vendors rank for this project."
								rows={8}
								placeholder={
									"Reflow burner rated for 10 ton/hour of steam\nFlue-gas measurement point on the stack\nCombustion controls to EN 61508 SIL 2"
								}
							/>
						)}
					</form.AppField>

					<form.AppField
						name="deliverables"
						validators={{ onChange: step3Validator(form, "deliverables") }}
					>
						{(field) => (
							<field.TextareaField
								label="Expected deliverables"
								description="One per line: what the vendor hands over, such as documents, equipment and test reports. Every bidder reads these on the tender."
								rows={8}
								placeholder={
									"Retrofit burner package with combustion controls\nCommissioning report including emissions results\nOperator training and the maintenance manual"
								}
							/>
						)}
					</form.AppField>
				</div>
			</section>
		</div>
	);
}
