import type { AdminVendor } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Badge,
	Button,
	cn,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
} from "@greenshift/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatDateTime } from "../lib/format";
import { useStepUpAction } from "../lib/use-step-up-action";
import { RatingBar } from "./rating-bar";
import { StepUpDialog } from "./step-up-dialog";

interface VendorDetailDialogProps {
	vendor: AdminVendor | null;
	onOpenChange: (open: boolean) => void;
}

/** What the profile still has to file before a verdict can be given. */
export function missingVendorPackItems(vendor: AdminVendor): string[] {
	const missing: string[] = [];
	if (!vendor.npwp) missing.push("NPWP");
	if (!vendor.tdp) missing.push("TDP");
	if (vendor.certifications.length === 0) missing.push("a certification entry");
	if (!vendor.certificateName) missing.push("the certificate file");
	return missing;
}

function Fact({ label, value }: { label: string; value: string | null }) {
	return (
		<div>
			<dt className="text-base text-muted-foreground">{label}</dt>
			<dd className="mt-1 text-base font-semibold">{value ?? "Not filed"}</dd>
		</div>
	);
}

export function VendorDetailDialog({
	vendor,
	onOpenChange,
}: VendorDetailDialogProps) {
	const queryClient = useQueryClient();
	const [reason, setReason] = useState("");
	const [error, setError] = useState<string | null>(null);

	const verify = useStepUpAction(
		(input: { id: number; verified: boolean; rejectionReason?: string }) =>
			api.admin.verifyVendor(input.id, input.verified, input.rejectionReason),
		() => {
			queryClient.invalidateQueries({ queryKey: ["admin", "vendors"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
		},
	);

	if (!vendor) return null;

	const verified = vendor.verifiedAt !== null;
	const missing = missingVendorPackItems(vendor);
	const scan = vendor.certificateScan;

	function decide(nextVerified: boolean) {
		if (!vendor) return;
		setError(null);
		if (!nextVerified && reason.trim().length === 0) {
			setError(
				"Say why it is turned down. The vendor reads this and corrects it.",
			);
			return;
		}
		void verify
			.run({
				id: vendor.id,
				verified: nextVerified,
				rejectionReason: nextVerified ? undefined : reason.trim(),
			})
			.then(() => onOpenChange(false))
			.catch((err: unknown) =>
				setError(
					err instanceof Error ? err.message : "The decision was not saved.",
				),
			);
	}

	return (
		<Dialog open={vendor !== null} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
				<DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-14">
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0 space-y-1">
							<DialogTitle className="truncate text-xl font-semibold">
								{vendor.companyName}
							</DialogTitle>
							<DialogDescription className="text-base">
								{vendor.email}
							</DialogDescription>
						</div>
						<Badge
							variant={verified ? "default" : "secondary"}
							className="shrink-0 !h-8 px-3 text-base rounded-md"
						>
							{verified ? "Verified" : "Not verified"}
						</Badge>
					</div>
				</DialogHeader>

				<div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
					{vendor.description ? (
						<p className="text-base leading-relaxed">{vendor.description}</p>
					) : null}

					<dl className="grid grid-cols-2 gap-x-6 gap-y-4">
						<Fact label="NIB" value={vendor.nib} />
						<Fact label="NPWP" value={vendor.npwp} />
						<Fact label="TDP" value={vendor.tdp} />
						<div>
							<dt className="text-base text-muted-foreground">Rating</dt>
							<dd className="mt-1 flex items-center gap-2">
								<RatingBar rating={vendor.rating} className="w-24" />
								<span className="text-base font-semibold tabular-nums">
									{vendor.rating.toFixed(1)}
								</span>
							</dd>
						</div>
						<Fact label="Total projects" value={String(vendor.totalProjects)} />
						<Fact label="Registered" value={formatDateTime(vendor.createdAt)} />
					</dl>

					<section className="space-y-2">
						<h3 className="text-base font-semibold">Certifications</h3>
						{vendor.certifications.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{vendor.certifications.map((cert) => (
									<Badge
										key={cert}
										variant="secondary"
										className="!h-8 px-3 text-base rounded-md"
									>
										{cert}
									</Badge>
								))}
							</div>
						) : (
							<p className="text-base text-muted-foreground">
								None listed, so there is nothing to verify.
							</p>
						)}
					</section>

					<section className="space-y-2">
						<h3 className="text-base font-semibold">Industry certificate</h3>
						{vendor.certificateName && vendor.certificateUrl ? (
							<a
								href={vendor.certificateUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-base font-medium text-blue-700 hover:underline"
							>
								{vendor.certificateName}
							</a>
						) : (
							<p className="text-base text-muted-foreground">Not filed.</p>
						)}
						{scan ? (
							<div className="space-y-1 rounded-lg bg-muted/50 px-3 py-2">
								<p className="text-base font-medium">
									{scan.verdict === "PASSED"
										? "Read and matched"
										: scan.verdict === "MISMATCH"
											? "Did not match"
											: "Could not be read"}
								</p>
								<p className="text-base leading-6">{scan.note}</p>
							</div>
						) : null}
					</section>

					<section className="space-y-2">
						<h3 className="text-base font-semibold">Portfolio</h3>
						{vendor.portfolio.length > 0 ? (
							<ul className="space-y-1">
								{vendor.portfolio.map((item) => (
									<li key={item} className="text-base">
										• {item}
									</li>
								))}
							</ul>
						) : (
							<p className="text-base text-muted-foreground">-</p>
						)}
					</section>

					{verified && vendor.rejectionReason ? (
						<div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-base text-red-700">
							{vendor.rejectionReason}
						</div>
					) : null}

					{!verified ? (
						<div className="space-y-2 border-t border-border pt-4">
							<Label htmlFor="vendor-turn-down-reason" className="text-base">
								Reason, if this is turned down
							</Label>
							<Input
								id="vendor-turn-down-reason"
								value={reason}
								placeholder="What the vendor has to correct"
								onChange={(event) => setReason(event.target.value)}
							/>
							{missing.length > 0 ? (
								<p className={cn("text-base", "text-muted-foreground")}>
									Still to file: {missing.join(", ")}. A profile cannot be
									verified before its pack is complete.
								</p>
							) : null}
						</div>
					) : null}

					{error ? (
						<p role="alert" className="text-base text-destructive">
							{error}
						</p>
					) : null}
				</div>

				<DialogFooter className="shrink-0 flex-wrap gap-2 border-t border-border px-6 py-4">
					<DialogClose asChild>
						<Button variant="outline">Close</Button>
					</DialogClose>
					<Button
						type="button"
						variant="destructive"
						disabled={verify.isPending}
						onClick={() => decide(false)}
					>
						{verified ? "Revoke verification" : "Turn down"}
					</Button>
					<Button
						type="button"
						disabled={verify.isPending || verified || missing.length > 0}
						onClick={() => decide(true)}
					>
						Verify this vendor
					</Button>
				</DialogFooter>
			</DialogContent>

			<StepUpDialog
				isOpen={verify.stepUpOpen}
				onClose={verify.closeStepUp}
				onSuccess={verify.retryAfterStepUp}
			/>
		</Dialog>
	);
}
