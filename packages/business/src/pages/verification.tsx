/* The company's own verification: the screen that stands in front of the whole
 * business surface.
 *
 * It is one job in one place, because an unverified account can reach nothing
 * else: confirm the company's details, file the two certificates behind its
 * legal identity, and submit the pack. The pack is read by the document scan,
 * which is what decides: a certificate that reads as the document it claims to
 * be, naming this company, verifies the account on the spot. A certificate the
 * scan cannot read is asked for again, and after the rescan budget is spent the
 * account goes to an administrator with the same reading in front of them.
 *
 * What the scan establishes is stated plainly on the page, because the
 * difference matters: it checks that the certificate names this company and
 * carries the numbers filed here. It does not prove the entity exists; only the
 * registry can say that.
 */

import {
	faCircleCheck,
	faFileShield,
	faPaperPlane,
	faShieldHalved,
	faTrash,
	faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	api,
	type CompanyDocument,
	type CompanyDocumentSlot,
	type CompanyVerification,
	industrySectors,
	registerLimits,
} from "@greenshift/core";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	cn,
	DistrictCombobox,
	EmptyState,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ShimmerBlock,
	useToast,
} from "@greenshift/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

/** The state as the company reads it: what it means, and what happens next. */
const STATE_READING: Record<
	CompanyVerification["status"],
	{ title: string; body: string }
> = {
	NOT_VERIFIED: {
		title: "Verify your company to open the platform",
		body: "Confirm your company's details, add its legal identity numbers, and file the two certificates behind them. The documents are read automatically, so verification is usually immediate.",
	},
	NEEDS_RESCAN: {
		title: "A clearer scan is needed",
		body: "One of the certificates could not be read. File it again as the PDF or scan it was issued as. The reading below says which one and why.",
	},
	PENDING: {
		title: "With an administrator",
		body: "The documents could not be read automatically, so an administrator will review them. Nothing else is needed from you for now.",
	},
	REJECTED: {
		title: "Verification could not be confirmed",
		body: "A certificate did not match this account. The reading below says what it found; correct the details or file the right document, then submit again.",
	},
	VERIFIED: {
		title: "Company verified",
		body: "Both certificates were read and match your company details. The platform is open to you.",
	},
};

/** The tone each state carries, so the page never leans on colour alone. */
const STATE_TONE: Record<CompanyVerification["status"], string> = {
	NOT_VERIFIED: "bg-amber-50 text-amber-700 border-amber-300",
	NEEDS_RESCAN: "bg-amber-50 text-amber-700 border-amber-300",
	PENDING: "bg-blue-50 text-blue-700 border-blue-300",
	REJECTED: "bg-red-50 text-red-700 border-red-300",
	VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-300",
};

/** One certificate slot: what is filed, what the scan read, and the controls. */
function DocumentSlot({
	document,
	busy,
	locked,
	onFile,
	onRemove,
}: {
	document: CompanyDocument;
	busy: boolean;
	locked: boolean;
	onFile: (file: File) => void;
	onRemove: () => void;
}) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const scan = document.scan;

	return (
		<div className="space-y-3 rounded-xl border border-border p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-sm font-semibold">{document.label}</p>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{document.fileName ?? "Nothing filed yet."}
					</p>
				</div>
				{scan ? (
					<Badge
						className={cn(
							"shrink-0",
							scan.verdict === "PASSED"
								? "bg-emerald-700 text-white"
								: scan.verdict === "MISMATCH"
									? "bg-red-700 text-white"
									: "bg-amber-700 text-white",
						)}
					>
						{scan.verdict === "PASSED"
							? "Read and matched"
							: scan.verdict === "MISMATCH"
								? "Did not match"
								: "Could not be read"}
					</Badge>
				) : null}
			</div>

			{scan ? (
				<div className="space-y-1 rounded-lg bg-muted/50 px-3 py-2">
					<p className="text-sm leading-6">{scan.note}</p>
					{scan.documentType || scan.companyName ? (
						<p className="text-sm text-muted-foreground">
							Read as {scan.documentType ?? "an unreadable document"}
							{scan.companyName ? `, naming ${scan.companyName}` : ""}.
						</p>
					) : null}
				</div>
			) : null}

			<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
				<input
					ref={inputRef}
					type="file"
					accept=".pdf,.jpg,.jpeg,.png,.webp"
					className="sr-only"
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (file) onFile(file);
						event.target.value = "";
					}}
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={busy || locked}
					onClick={() => inputRef.current?.click()}
				>
					<FontAwesomeIcon icon={faUpload} aria-hidden />
					{document.fileName ? "Replace the file" : "File the certificate"}
				</Button>
				{document.fileName && document.downloadUrl ? (
					<a
						href={document.downloadUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm font-medium text-blue-700 hover:underline"
					>
						Open the filed file
					</a>
				) : null}
				{document.fileName && !locked ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={busy}
						onClick={onRemove}
						className="text-destructive hover:text-destructive"
					>
						<FontAwesomeIcon icon={faTrash} aria-hidden />
						Remove
					</Button>
				) : null}
			</div>
		</div>
	);
}

export function CompanyVerificationPage() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const verificationQuery = useQuery({
		queryKey: ["business", "verification"],
		queryFn: async () => (await api.business.verification()).verification,
	});
	const verification = verificationQuery.data ?? null;

	/* The fields start from the account's own record and are the company's to
	   correct. They are seeded once, so a refetch after a save does not fight the
	   reader's typing. */
	const [form, setForm] = useState<{
		companyName: string;
		industrySector: string;
		representative: string;
		contactPhone: string;
		address: string;
		nib: string;
		npwp: string;
	} | null>(null);
	const values = form ?? {
		companyName: verification?.companyName ?? "",
		industrySector: verification?.industrySector ?? "",
		representative: verification?.representative ?? "",
		contactPhone: verification?.contactPhone ?? "",
		address: verification?.address ?? "",
		nib: verification?.nib ?? "",
		npwp: verification?.npwp ?? "",
	};

	const locked = verification?.status === "VERIFIED";
	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: ["business", "verification"] });

	const saveDetails = useMutation({
		mutationFn: (body: typeof values) => api.business.saveVerification(body),
		onSuccess: async () => {
			await refresh();
			// The session carries the state, so the shell's gate reads the new one.
			await queryClient.invalidateQueries({ queryKey: ["session"] });
		},
	});

	const uploadDocument = useMutation({
		mutationFn: ({ slot, file }: { slot: CompanyDocumentSlot; file: File }) =>
			api.business.uploadVerificationDocument(slot, file),
		onSuccess: refresh,
	});

	const removeDocument = useMutation({
		mutationFn: (slot: CompanyDocumentSlot) =>
			api.business.removeVerificationDocument(slot),
		onSuccess: refresh,
	});

	const submit = useMutation({
		mutationFn: async () => {
			// One press does the whole job: the details are saved first, so what the
			// scan compares against is what the company just confirmed.
			await api.business.saveVerification(values);
			return api.business.submitVerification();
		},
		onSuccess: async () => {
			await refresh();
			await queryClient.invalidateQueries({ queryKey: ["session"] });
			toast({
				tone: "info",
				title: "Pack filed",
				message: "The documents have been read. The result is on this page.",
			});
		},
	});

	const busy =
		uploadDocument.isPending ||
		removeDocument.isPending ||
		submit.isPending ||
		saveDetails.isPending;

	if (verificationQuery.isPending) {
		return (
			<div className="space-y-6" aria-busy>
				<ShimmerBlock className="h-28 w-full rounded-xl" />
				<ShimmerBlock className="h-64 w-full rounded-xl" />
			</div>
		);
	}

	if (verificationQuery.isError || !verification) {
		return (
			<EmptyState
				tone="error"
				title="Your verification did not load"
				description="The verification endpoint could not be reached."
				action={
					<Button variant="outline" onClick={() => verificationQuery.refetch()}>
						Try again
					</Button>
				}
			/>
		);
	}

	const reading = STATE_READING[verification.status];
	/* What is still missing, read from the live form and the filed files rather
	   than from the server's copy: the numbers are saved by the same press that
	   submits, so a list built from the stored row would keep asking for what the
	   reader has already typed. */
	const pendingMissing = [
		...(values.companyName.trim() ? [] : ["Company name"]),
		...(values.industrySector ? [] : ["Industry sector"]),
		...(values.address.trim() ? [] : ["Registered address"]),
		...(values.representative.trim() ? [] : ["Representative"]),
		...(values.nib.trim() ? [] : ["Business identification number (NIB)"]),
		...(values.npwp.trim() ? [] : ["Tax identification number (NPWP)"]),
		...verification.documents
			.filter((document) => !document.fileName)
			.map((document) => document.label),
	];
	const readyToSubmit = !locked && pendingMissing.length === 0;

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold">Company verification</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					The platform is open to your company once this is complete. It is read
					automatically, so most companies are through in a moment.
				</p>
			</div>

			<section
				className={cn(
					"space-y-2 rounded-xl border px-5 py-4",
					STATE_TONE[verification.status],
				)}
			>
				<div className="flex items-center gap-2">
					<FontAwesomeIcon
						icon={
							verification.status === "VERIFIED"
								? faCircleCheck
								: faShieldHalved
						}
						aria-hidden
					/>
					<h2 className="text-base font-semibold">{reading.title}</h2>
				</div>
				<p className="text-sm leading-6">{reading.body}</p>
				{verification.status === "VERIFIED" ? (
					<Button size="sm" asChild className="mt-1 w-fit">
						<a href="/business">Open the dashboard</a>
					</Button>
				) : null}
				{verification.status === "NEEDS_RESCAN" ? (
					<p className="text-sm">
						Clearer scans left: {verification.rescansLeft}. After that an
						administrator reads the file instead.
					</p>
				) : null}
			</section>

			{verification.status !== "VERIFIED" ? (
				<section className="space-y-4">
					<div className="border-b border-border pb-3">
						<h2 className="text-lg font-semibold">A. Company details</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							What the documents are checked against. Correct anything the
							registry would write differently.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="v-name">Company name</Label>
							<Input
								id="v-name"
								value={values.companyName}
								maxLength={registerLimits.organizationName}
								onChange={(event) =>
									setForm({ ...values, companyName: event.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="v-sector">Industry sector</Label>
							<Select
								value={values.industrySector}
								onValueChange={(sector) =>
									setForm({ ...values, industrySector: sector })
								}
							>
								<SelectTrigger id="v-sector" className="w-full">
									<SelectValue placeholder="Choose a sector" />
								</SelectTrigger>
								<SelectContent>
									{industrySectors.map((sector) => (
										<SelectItem key={sector} value={sector}>
											{sector}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="v-representative">Representative</Label>
							<Input
								id="v-representative"
								value={values.representative}
								maxLength={registerLimits.name}
								onChange={(event) =>
									setForm({ ...values, representative: event.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="v-phone">Contact phone</Label>
							<Input
								id="v-phone"
								value={values.contactPhone}
								maxLength={registerLimits.phone}
								onChange={(event) =>
									setForm({ ...values, contactPhone: event.target.value })
								}
							/>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="v-address">Registered address</Label>
							<DistrictCombobox
								id="v-address"
								value={values.address}
								onChange={(address) => setForm({ ...values, address })}
							/>
							<p className="text-sm text-muted-foreground">
								Pick the district the company is registered in.
							</p>
						</div>
					</div>
				</section>
			) : null}

			{verification.status !== "VERIFIED" ? (
				<section className="space-y-4">
					<div className="border-b border-border pb-3">
						<h2 className="text-lg font-semibold">B. Legal identity</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							The numbers the certificates have to carry, so the scan can check
							the documents against this account.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="v-nib">
								Business identification number (NIB)
							</Label>
							<Input
								id="v-nib"
								value={values.nib}
								maxLength={registerLimits.legalId}
								placeholder="13 digits"
								onChange={(event) =>
									setForm({ ...values, nib: event.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="v-npwp">Tax number (NPWP)</Label>
							<Input
								id="v-npwp"
								value={values.npwp}
								maxLength={registerLimits.legalId}
								placeholder="15 or 16 digits"
								onChange={(event) =>
									setForm({ ...values, npwp: event.target.value })
								}
							/>
						</div>
					</div>
				</section>
			) : null}

			<section className="space-y-4">
				<div className="border-b border-border pb-3">
					<h2 className="text-lg font-semibold">C. Certificates</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						The deed of incorporation and the trading licence, as PDFs or scans.
						The reading below each one is what the verification decides on: it
						checks that the certificate names this company and carries the
						numbers above. It does not prove the entity exists; only the
						registry can confirm that.
					</p>
				</div>
				<div className="space-y-3">
					{verification.documents.map((document) => (
						<DocumentSlot
							key={document.slot}
							document={document}
							busy={busy}
							locked={locked}
							onFile={(file) =>
								uploadDocument.mutate({ slot: document.slot, file })
							}
							onRemove={() => removeDocument.mutate(document.slot)}
						/>
					))}
				</div>
			</section>

			{verification.status !== "VERIFIED" ? (
				<Card>
					<CardHeader className="border-b border-border bg-muted/30">
						<CardTitle className="flex items-center gap-2 text-base">
							<FontAwesomeIcon icon={faFileShield} className="text-[#03442C]" />
							Submit the pack
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 p-6">
						{pendingMissing.length > 0 ? (
							<div className="space-y-1">
								<p className="text-sm font-medium">
									Still needed before this can be submitted:
								</p>
								<ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
									{pendingMissing.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								Everything the scan needs is on file. Submitting reads both
								certificates and decides.
							</p>
						)}

						{verification.rejectionReason ? (
							<div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
								{verification.rejectionReason}
							</div>
						) : null}

						<div className="flex flex-wrap items-center gap-3">
							<Button
								type="button"
								disabled={!readyToSubmit || busy}
								onClick={() => submit.mutate()}
								className="gap-2 bg-[#00712D] font-semibold text-white hover:bg-[#00712D]/90"
							>
								<FontAwesomeIcon icon={faPaperPlane} aria-hidden />
								{submit.isPending
									? "Reading the documents…"
									: "Submit for verification"}
							</Button>
							{submit.isError ? (
								<p role="alert" className="text-sm text-destructive">
									The pack was not submitted. Check the fields above and try
									again.
								</p>
							) : null}
						</div>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
