import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ShimmerBlock,
} from "@greenshift/ui";

interface TenderTechnicalProposalCardProps {
	technicalSpec: string | null;
	loading?: boolean;
}

export function TenderTechnicalProposalCard({
	technicalSpec,
	loading = false,
}: TenderTechnicalProposalCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Technical Approach</CardTitle>
			</CardHeader>
			<CardContent className="text-sm">
				{loading ? (
					<div className="space-y-2">
						<ShimmerBlock className="h-4 w-full rounded" />
						<ShimmerBlock className="h-4 w-4/5 rounded" />
						<ShimmerBlock className="h-4 w-2/3 rounded" />
					</div>
				) : technicalSpec ? (
					<p className="whitespace-pre-line leading-relaxed text-muted-foreground">
						{technicalSpec}
					</p>
				) : (
					<p className="text-muted-foreground">
						No technical specification was submitted with this proposal.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
