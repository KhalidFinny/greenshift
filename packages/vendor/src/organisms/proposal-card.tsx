import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ShimmerBlock,
} from "@greenshift/ui";
import { formatRupiah, formatShortDate } from "../lib/format";
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE } from "../lib/labels";
import type { StructuredProposal } from "../lib/types";

interface ProposalCardProps {
	proposal: StructuredProposal;
	loading?: boolean;
}

/**
 * Proposal status badges on the light card surface. The 600 shades that carried
 * white text here were below AA, so the tones use the 700 shades.
 */
const TONE_CLASS: Record<string, string> = {
	default: "bg-blue-700 text-white",
	secondary: "bg-slate-600 text-white",
	destructive: "bg-red-700 text-white",
	outline: "border border-border text-foreground",
};

export function ProposalCard({ proposal, loading = false }: ProposalCardProps) {
	const tone = PROPOSAL_STATUS_TONE[proposal.status];
	const label = PROPOSAL_STATUS_LABEL[proposal.status];

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div className="min-w-0">
					<Badge className={TONE_CLASS[tone]}>{label}</Badge>
					<CardTitle className="mt-2 text-lg">
						{proposal.projectTitle || "Untitled tender"}
					</CardTitle>
					{proposal.companyName ? (
						<p className="mt-0.5 text-sm text-muted-foreground">
							{proposal.companyName}
						</p>
					) : null}
				</div>
				<div className="shrink-0 text-right">
					<p className="text-sm text-muted-foreground">Proposed value</p>
					<p className="text-lg font-bold text-[#00712D] tabular-nums">
						{formatRupiah(proposal.costBreakdown.totalPrice)}
					</p>
				</div>
			</CardHeader>

			{/* Only figures the API actually reports. Nothing estimated. */}
			<CardContent className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
				{loading ? (
					<ShimmerBlock className="h-4 w-64 rounded" />
				) : (
					<>
						<span className="text-muted-foreground">
							Submitted{" "}
							<span className="font-medium text-foreground">
								{proposal.submittedAt
									? formatShortDate(proposal.submittedAt)
									: "not recorded"}
							</span>
						</span>
						<span className="text-muted-foreground">
							Revisions{" "}
							<span className="font-medium text-foreground tabular-nums">
								{proposal.revisionCount}
							</span>
						</span>
					</>
				)}
			</CardContent>
		</Card>
	);
}
