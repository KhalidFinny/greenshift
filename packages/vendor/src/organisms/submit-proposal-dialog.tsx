import { faFileUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useAppForm,
} from "@greenshift/ui";
import { formatRupiah } from "../lib/format";
import type { VendorProjectCardData } from "../lib/types";

interface SubmitProposalDialogProps {
	project: VendorProjectCardData;
	onSubmit: (data: {
		tenderId: number;
		amount: number;
		technicalSpec: string;
		operationalCost: number;
		projectedRoi: number;
		warrantyPeriod: number;
	}) => void;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

function formatNumber(value: string): string {
	if (!value) return "";
	const num = value.replace(/\D/g, "");
	if (!num) return "";
	return Number(num).toLocaleString("id-ID");
}

export function SubmitProposalDialog({
	project,
	onSubmit,
	isOpen,
	onOpenChange,
}: SubmitProposalDialogProps) {
	const form = useAppForm({
		defaultValues: {
			amount: "",
			operationalCost: "",
			warrantyPeriod: "2",
		},
		onSubmit: async ({ value }) => {
			onSubmit({
				tenderId: Number(project.id),
				amount: Number(value.amount.replace(/\D/g, "")),
				technicalSpec: "",
				operationalCost: Number(value.operationalCost.replace(/\D/g, "")),
				projectedRoi: 0,
				warrantyPeriod: Number(value.warrantyPeriod),
			});
			onOpenChange(false);
		},
	});

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="!max-w-lg gap-0 p-0">
				<DialogHeader className="border-b border-border px-6 pt-6 pb-4">
					<DialogTitle className="text-xl font-semibold">
						{project.procurementMethod === "OPEN_BIDDING"
							? "Submit Your Bid"
							: "Submit Proposal"}
					</DialogTitle>
				</DialogHeader>

				<div className="px-6 pt-5 pb-6">
					<div className="mb-5 rounded-lg bg-muted p-4">
						<p className="text-sm font-semibold text-foreground">
							{project.title}
						</p>
						<p className="text-sm text-muted-foreground">
							Budget: {formatRupiah(project.estimatedValue)}
						</p>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							void form.handleSubmit();
						}}
						className="space-y-4"
						noValidate
					>
						<form.AppField
							name="amount"
							validators={{
								onChange: ({ value }) => (value ? undefined : "Required"),
							}}
						>
							{(field) => {
								const raw = field.state.value?.replace(/\D/g, "") ?? "";
								const pct = raw
									? ((Number(raw) / project.estimatedValue) * 100).toFixed(1)
									: null;
								return (
									<div className="space-y-1.5">
										<Label htmlFor="amount" className="text-sm">
											Your Bid Price (IDR) *
										</Label>
										<Input
											id="amount"
											type="text"
											inputMode="numeric"
											placeholder="850.000.000"
											className="h-11"
											value={
												field.state.value ? formatNumber(field.state.value) : ""
											}
											onChange={(e) =>
												field.handleChange(e.target.value.replace(/\D/g, ""))
											}
										/>
										{pct && (
											<p className="text-sm text-muted-foreground">
												{pct}% of client budget
											</p>
										)}
									</div>
								);
							}}
						</form.AppField>

						<form.AppField name="operationalCost">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="op-cost" className="text-sm">
										Operational Cost (IDR)
									</Label>
									<Input
										id="op-cost"
										type="text"
										inputMode="numeric"
										placeholder="0"
										className="h-11"
										value={
											field.state.value ? formatNumber(field.state.value) : ""
										}
										onChange={(e) =>
											field.handleChange(e.target.value.replace(/\D/g, ""))
										}
									/>
								</div>
							)}
						</form.AppField>

						<form.AppField name="warrantyPeriod">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="warranty" className="text-sm">
										Warranty Period (Years)
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(v) => field.handleChange(v)}
									>
										<SelectTrigger id="warranty" className="h-11">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="1">1 Year</SelectItem>
											<SelectItem value="2">2 Years</SelectItem>
											<SelectItem value="3">3 Years</SelectItem>
											<SelectItem value="5">5 Years</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.AppField>

						<div className="space-y-1.5">
							<Label className="text-sm">Proposal Document</Label>
							<label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-[#00712D]/40 hover:bg-muted">
								<FontAwesomeIcon icon={faFileUpload} className="text-base" />
								Upload PDF Proposal
								<input type="file" accept=".pdf" className="hidden" />
							</label>
						</div>

						<div className="flex gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<form.AppForm>
								<form.SubmitButton className="flex-1 bg-[#00712D] font-semibold text-white hover:bg-[#00712D]/90">
									Submit Proposal
								</form.SubmitButton>
							</form.AppForm>
						</div>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
