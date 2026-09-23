/* A refusal needs its reason: that reason is what the company reads and corrects. */

import type {
	AdminCompanyVerification,
	AdminUser,
} from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Badge,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	EmptyState,
	Input,
	Label,
	ShimmerBlock,
} from "@greenshift/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useStepUpAction } from "../lib/use-step-up-action";
import { StepUpDialog } from "./step-up-dialog";

const STATE_LABEL: Record<string, string> = {
	NOT_VERIFIED: "Nothing filed",
	NEEDS_RESCAN: "Clearer scan asked for",
	PENDING: "Waiting on a reviewer",
	REJECTED: "Turned down",
	VERIFIED: "Verified",
};

function Fact({ label, value }: { label: string; value: string | null }) {
	return (
		<div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="text-right text-sm font-medium">{value ?? "Not filed"}</dd>
		</div>
	);
}

export interface CompanyVerificationDialogProps {
	user: AdminUser;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CompanyVerificationDialog({
	user,
	open,
	onOpenChange,
}: CompanyVerificationDialogProps) {
	const queryClient = useQueryClient();
	const [reason, setReason] = useState("");
	const [error, setError] = useState<string | null>(null);

	const verificationQuery = useQuery({
		queryKey: ["admin", "user-verification", user.id],
		enabled: open,
		queryFn: async () =>
			(await api.admin.userVerification(user.id)).verification,
	});
	const verification: AdminCompanyVerification | null =
		verificationQuery.data ?? null;

	const verify = useStepUpAction(
		(input: { verified: boolean; rejectionReason?: string }) =>
			api.admin.verifyUser(user.id, input.verified, input.rejectionReason),
		() => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			queryClient.invalidateQueries({
				queryKey: ["admin", "user-verification", user.id],
			});
			queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
		},
	);

	function decide(verified: boolean) {
		setError(null);
		if (!verified && reason.trim().length === 0) {
			setError(
				"Say why it is turned down. The company reads this and corrects it.",
			);
			return;
		}
		void verify
			.run({ verified, rejectionReason: verified ? undefined : reason.trim() })
			.then(() => onOpenChange(false))
			.catch((err: unknown) =>
				setError(
					err instanceof Error ? err.message : "The decision was not saved.",
				),
			);
	}

	const state = verification?.verifiedAt
		? "VERIFIED"
		: (user.verificationState ?? "NOT_VERIFIED");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3">
						{verification?.companyName ?? user.companyName ?? user.name}
						<Badge
							className={cn(
								state === "VERIFIED"
									? "bg-emerald-700 text-white"
									: state === "REJECTED"
										? "bg-red-700 text-white"
										: "bg-amber-700 text-white",
							)}
						>
							{STATE_LABEL[state] ?? state}
						</Badge>
					</DialogTitle>
					<DialogDescription className="text-base">
						{user.email}
						{verification?.submittedAt
							? ` · filed ${new Date(verification.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
							: " · nothing filed yet"}
					</DialogDescription>
				</DialogHeader>

				{verificationQuery.isPending ? (
					<div className="space-y-3">
						<ShimmerBlock className="h-32 w-full rounded-xl" />
						<ShimmerBlock className="h-32 w-full rounded-xl" />
					</div>
				) : verificationQuery.isError || !verification ? (
					<EmptyState
						tone="error"
						title="The filed pack did not load"
						description="GET /api/admin/users/:id/verification did not answer."
						action={
							<Button
								variant="outline"
								onClick={() => verificationQuery.refetch()}
							>
								Try again
							</Button>
						}
					/>
				) : (
					<div className="space-y-6 pt-2">
						<div className="grid gap-6 md:grid-cols-2">
							<dl className="space-y-2">
								<Fact label="Sector" value={verification.industrySector} />
								<Fact
									label="Representative"
									value={verification.representative}
								/>
								<Fact label="Contact phone" value={verification.contactPhone} />
								<Fact label="Registered address" value={verification.address} />
								<Fact label="NIB" value={verification.nib} />
								<Fact label="NPWP" value={verification.npwp} />
							</dl>
							<div className="space-y-4">
								{verification.documents.map((document) => (
									<div
										key={document.slot}
										className="space-y-2 rounded-xl border border-border p-4"
									>
										<p className="text-sm font-semibold">{document.label}</p>
										{document.fileName && document.downloadUrl ? (
											<a
												href={document.downloadUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm font-medium text-blue-700 hover:underline"
											>
												{document.fileName}
											</a>
										) : (
											<p className="text-sm text-muted-foreground">
												Not filed.
											</p>
										)}
										{document.scan ? (
											<div className="space-y-1 rounded-lg bg-muted/50 px-3 py-2">
												<p className="text-sm font-medium">
													{document.scan.verdict === "PASSED"
														? "Read and matched"
														: document.scan.verdict === "MISMATCH"
															? "Did not match"
															: "Could not be read"}
												</p>
												<p className="text-sm leading-6">
													{document.scan.note}
												</p>
											</div>
										) : null}
									</div>
								))}
							</div>
						</div>

						{verification.rejectionReason ? (
							<div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
								{verification.rejectionReason}
							</div>
						) : null}

						<div className="space-y-2 border-t border-border pt-4">
							<Label htmlFor="turn-down-reason" className="text-sm">
								Reason, if this is turned down
							</Label>
							<Input
								id="turn-down-reason"
								value={reason}
								placeholder="What the company has to correct"
								onChange={(event) => setReason(event.target.value)}
							/>
						</div>

						{error ? (
							<p role="alert" className="text-sm text-destructive">
								{error}
							</p>
						) : null}

						<div className="flex flex-wrap justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={verify.isPending}
								onClick={() => onOpenChange(false)}
							>
								Close
							</Button>
							<Button
								type="button"
								variant="destructive"
								disabled={verify.isPending}
								onClick={() => decide(false)}
							>
								{state === "VERIFIED" ? "Revoke verification" : "Turn down"}
							</Button>
							<Button
								type="button"
								disabled={verify.isPending || state === "VERIFIED"}
								onClick={() => decide(true)}
							>
								Verify this company
							</Button>
						</div>
					</div>
				)}
			</DialogContent>

			{/* Step-up: the prompt has to be mounted for the pending call to resume once the password is confirmed. */}
			<StepUpDialog
				isOpen={verify.stepUpOpen}
				onClose={verify.closeStepUp}
				onSuccess={verify.retryAfterStepUp}
			/>
		</Dialog>
	);
}
