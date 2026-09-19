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
import { useState } from "react";
import type { VendorPortfolioItem } from "../lib/types";

interface AddPortfolioDialogProps {
	onAdd: (item: VendorPortfolioItem) => void;
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
	const [documents, setDocuments] = useState<{ name: string; type: string }[]>(
		[],
	);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files) {
			const newDocs = Array.from(files).map((file) => ({
				name: file.name,
				type: file.type,
			}));
			setDocuments((prev) => [...prev, ...newDocs]);
		}
	};

	const removeDocument = (index: number) => {
		setDocuments((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!projectName || !clientName) return;

		const newItem: VendorPortfolioItem = {
			id: `port-${Date.now()}`,
			projectName,
			clientName,
			projectType,
			location,
			description,
			projectValue: Number(projectValue) || 0,
			// Every figure below is left empty when the vendor did not enter one.
			// Filling in a plausible number would put our estimate in their record.
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
			// A vendor cannot mark their own record verified. That is an admin act.
			status: "COMPLETED",
			documentName: documents[0]?.name || undefined,
		};

		onAdd(newItem);
		setOpen(false);
		setProjectName("");
		setClientName("");
		setDocuments([]);
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
						<Label className="text-sm font-semibold">
							Supporting Documents
						</Label>
						<p className="text-sm text-muted-foreground">
							Upload BAST certificates, photos, inspection reports, or other
							verification documents.
						</p>
						<div className="rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-emerald-500/50 hover:bg-emerald-50/50">
							<input
								type="file"
								id="p-docs"
								multiple
								accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
								className="hidden"
								onChange={handleFileChange}
							/>
							<label htmlFor="p-docs" className="cursor-pointer">
								<FontAwesomeIcon
									icon={faFileUpload}
									className="mb-2 text-3xl text-muted-foreground"
								/>
								<p className="text-sm text-muted-foreground">
									Click to upload or drag and drop
								</p>
								<p className="mt-1 text-sm text-muted-foreground/70">
									PDF, JPG, PNG, DOC (Max 10MB each)
								</p>
							</label>
						</div>

						{documents.length > 0 && (
							<div className="space-y-2">
								<p className="text-sm font-medium text-muted-foreground">
									{documents.length} file(s) uploaded
								</p>
								{documents.map((doc, index) => (
									<div
										key={`${doc.name}-${index}`}
										className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
									>
										<div className="flex items-center gap-2">
											<FontAwesomeIcon
												icon={faFileUpload}
												className="text-sm text-emerald-700"
											/>
											<span className="text-sm text-foreground truncate max-w-[250px]">
												{doc.name}
											</span>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											className="text-destructive hover:text-destructive"
											aria-label={`Remove ${doc.name}`}
											onClick={() => removeDocument(index)}
										>
											<FontAwesomeIcon icon={faX} className="text-sm" />
										</Button>
									</div>
								))}
							</div>
						)}
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
