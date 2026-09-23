import { faAward, faFileUpload, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
} from "@greenshift/ui";
import { useRef, useState } from "react";
import type { VendorPortfolioItem } from "../lib/types";

interface AddPortfolioDialogProps {
	onAdd: (item: VendorPortfolioItem, file: File | null) => Promise<void>;
}

export function AddPortfolioDialog({ onAdd }: AddPortfolioDialogProps) {
	const [open, setOpen] = useState(false);
	const [projectName, setProjectName] = useState("");
	const [clientName, setClientName] = useState("");
	const [projectType, setProjectType] = useState("Solar PV Rooftop");
	const [location, setLocation] = useState("");
	const [description, setDescription] = useState("");
	const [projectValue, setProjectValue] = useState("");
	const [durationMonths] = useState("4");
	const [energySavingPercent, setEnergySavingPercent] = useState("20");
	const [carbonReductionTons, setCarbonReductionTons] = useState("500");
	const [completionYear, setCompletionYear] = useState("2025");
	const [file, setFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFile(e.target.files?.[0] ?? null);
	};

	const removeFile = () => {
		setFile(null);
		// Clearing the input lets the same file be chosen again after removal.
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!projectName || !clientName || isSubmitting) return;

		const newItem: VendorPortfolioItem = {
			id: `port-${Date.now()}`,
			projectName,
			clientName,
			projectType,
			location,
			description,
			projectValue: Number(projectValue) || 0,
			// Left empty when the vendor entered nothing; a plausible number would be our estimate.
			durationMonths: durationMonths ? Number(durationMonths) : null,
			servicesProvided: "",
			energySavingKwh: null,
			energySavingPercent: energySavingPercent
				? Number(energySavingPercent)
				: null,
			carbonReductionTons: carbonReductionTons
				? Number(carbonReductionTons)
				: null,
			completionYear: completionYear ? Number(completionYear) : null,
			documentUrl: null,
		};

		setIsSubmitting(true);
		try {
			await onAdd(newItem, file);
		} catch {
			// The shared client already reported the failure as a toast; the dialog stays open so the vendor can retry.
			return;
		} finally {
			setIsSubmitting(false);
		}

		setOpen(false);
		setProjectName("");
		setClientName("");
		removeFile();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="bg-[#00712D] text-white hover:bg-[#00712D]/90">
					Add Portfolio Record
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faAward} className="text-emerald-700" />
						Add Project Portfolio Track Record
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-5 pt-2 text-sm">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="p-name" className="text-sm font-semibold">
								Project Name *
							</Label>
							<Input
								id="p-name"
								value={projectName}
								onChange={(e) => setProjectName(e.target.value)}
								placeholder="e.g. 1 MWp Rooftop Solar PV for Textile Plant"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="p-client" className="text-sm font-semibold">
								Client / Company Name *
							</Label>
							<Input
								id="p-client"
								value={clientName}
								onChange={(e) => setClientName(e.target.value)}
								placeholder="e.g. PT Industri Nusantara"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div className="space-y-1.5">
							<Label htmlFor="p-type" className="text-sm font-semibold">
								Project Category
							</Label>
							<Input
								id="p-type"
								value={projectType}
								onChange={(e) => setProjectType(e.target.value)}
								placeholder="Solar PV / HVAC / Biomass"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="p-loc" className="text-sm font-semibold">
								Project Location
							</Label>
							<Input
								id="p-loc"
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder="City, Province"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="p-val" className="text-sm font-semibold">
								Project Value (IDR)
							</Label>
							<Input
								id="p-val"
								type="number"
								value={projectValue}
								onChange={(e) => setProjectValue(e.target.value)}
								placeholder="5000000000"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div className="space-y-1.5">
							<Label htmlFor="p-save" className="text-sm font-semibold">
								Energy Savings (%)
							</Label>
							<Input
								id="p-save"
								type="number"
								value={energySavingPercent}
								onChange={(e) => setEnergySavingPercent(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="p-carb" className="text-sm font-semibold">
								Carbon Reduction (tCO₂e/yr)
							</Label>
							<Input
								id="p-carb"
								type="number"
								value={carbonReductionTons}
								onChange={(e) => setCarbonReductionTons(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="p-year" className="text-sm font-semibold">
								Completion Year
							</Label>
							<Input
								id="p-year"
								type="number"
								value={completionYear}
								onChange={(e) => setCompletionYear(e.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="p-desc" className="text-sm font-semibold">
							Description & Execution Scope
						</Label>
						<textarea
							id="p-desc"
							rows={3}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe technical specifications and achieved energy savings..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="p-doc" className="text-sm font-semibold">
							Supporting Document
						</Label>
						<p className="text-sm text-muted-foreground">
							Upload BAST certificates, photos, inspection reports, or other
							verification documents.
						</p>
						<div className="rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-emerald-500/50 hover:bg-emerald-50/50">
							{/* Visually hidden but focusable: the label is the control a pointer sees, the input what the keyboard reaches. */}
							<input
								ref={fileInputRef}
								type="file"
								id="p-doc"
								accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
								className="peer sr-only"
								onChange={handleFileChange}
							/>
							<label
								htmlFor="p-doc"
								className="block cursor-pointer rounded-md peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
							>
								<FontAwesomeIcon
									icon={faFileUpload}
									className="mb-2 text-3xl text-muted-foreground"
								/>
								<p className="text-sm text-muted-foreground">
									Click to choose a file
								</p>
								<p className="mt-1 text-sm text-muted-foreground/70">
									PDF, Word, PNG, JPG or WebP (max 10 MB)
								</p>
							</label>
						</div>

						{file ? (
							<div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
								<div className="flex items-center gap-2">
									<FontAwesomeIcon
										icon={faFileUpload}
										className="text-sm text-emerald-700"
									/>
									<span className="max-w-[250px] truncate text-sm text-foreground">
										{file.name}
									</span>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="text-destructive hover:text-destructive"
									aria-label={`Remove ${file.name}`}
									onClick={removeFile}
								>
									<FontAwesomeIcon icon={faX} className="text-sm" />
								</Button>
							</div>
						) : null}
					</div>

					<div className="flex justify-end gap-2 border-t border-border pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="bg-[#00712D] text-white hover:bg-[#00712D]/90"
						>
							Save to Track Record
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
