import { Card, CardContent, CardHeader, CardTitle } from "@greenshift/ui";
import type { StructuredProposal } from "../lib/types";

interface TenderTechnicalProposalCardProps {
	proposal: StructuredProposal;
}

export function TenderTechnicalProposalCard({
	proposal,
}: TenderTechnicalProposalCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">
					Technical Proposal Specifications
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				<div>
					<h4 className="font-semibold text-foreground">Technical Solution:</h4>
					<p className="mt-1 text-muted-foreground">
						{proposal.technicalSolution}
					</p>
				</div>

				<div>
					<h4 className="font-semibold text-foreground">
						Equipment Specifications:
					</h4>
					<p className="mt-1 text-muted-foreground">
						{proposal.equipmentSpecs}
					</p>
				</div>

				<div>
					<h4 className="font-semibold text-foreground">
						Scope of Work Included:
					</h4>
					<p className="mt-1 text-muted-foreground">{proposal.includedScope}</p>
				</div>

				<div>
					<h4 className="font-semibold text-foreground">
						Warranty & Service Coverage:
					</h4>
					<p className="mt-1 text-muted-foreground">
						{proposal.warrantyCoverage}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
