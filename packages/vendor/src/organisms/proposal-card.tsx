import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { formatRupiah } from "../lib/format";
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE } from "../lib/labels";
import type { StructuredProposal } from "../lib/types";

interface ProposalCardProps {
	proposal: StructuredProposal;
}

const TONE_CLASS: Record<string, string> = {
	default: "bg-blue-600 text-white",
	secondary: "bg-slate-500 text-white",
	destructive: "bg-red-600 text-white",
	outline: "border border-border text-foreground",
};

export function ProposalCard({ proposal }: ProposalCardProps) {
	const tone = PROPOSAL_STATUS_TONE[proposal.status];
	const label = PROPOSAL_STATUS_LABEL[proposal.status];

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<div>
					<Badge className={TONE_CLASS[tone]}>{label}</Badge>
					<CardTitle className="mt-2 text-lg">
						{proposal.projectTitle}
					</CardTitle>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Client: {proposal.companyName}
					</p>
				</div>
				<div className="text-right">
					<p className="text-xs text-muted-foreground">Total Proposed Value</p>
					<p className="text-lg font-bold text-[#03442C] dark:text-emerald-400">
						{formatRupiah(proposal.costBreakdown.totalPrice)}
					</p>
				</div>
			</CardHeader>
			<CardContent className="space-y-4 text-xs">
				<div className="space-y-2 rounded-lg border border-border p-3">
					<p className="font-semibold text-foreground">Executive Summary:</p>
					<p className="text-muted-foreground">{proposal.executiveSummary}</p>
				</div>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<div className="rounded-lg bg-muted p-2.5">
						<p className="text-muted-foreground">Energy Savings</p>
						<p className="mt-0.5 font-semibold text-foreground">
							{proposal.expectedImpact.energySavingsPercent}% / yr
						</p>
					</div>
					<div className="rounded-lg bg-muted p-2.5">
						<p className="text-muted-foreground">Carbon Reduction</p>
						<p className="mt-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
							{proposal.expectedImpact.carbonReductionTons} tCO₂e/yr
						</p>
					</div>
					<div className="rounded-lg bg-muted p-2.5">
						<p className="text-muted-foreground">Unit & Service Warranty</p>
						<p className="mt-0.5 font-semibold text-foreground">
							{proposal.warrantyYears} Years
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
