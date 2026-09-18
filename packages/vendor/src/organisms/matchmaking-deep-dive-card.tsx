import { faLeaf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent, CardHeader, CardTitle } from "@greenshift/ui";
import type { MatchmakingBreakdown } from "../lib/types";

interface MatchmakingDeepDiveCardProps {
	matchmaking: MatchmakingBreakdown;
}

export function MatchmakingDeepDiveCard({
	matchmaking,
}: MatchmakingDeepDiveCardProps) {
	const criteria = [
		{
			label: "Technical Fit",
			score: matchmaking.technicalFit,
			explanation: matchmaking.technicalFitExplanation,
		},
		{
			label: "Relevant Experience",
			score: matchmaking.relevantExperience,
			explanation: matchmaking.relevantExperienceExplanation,
		},
		{
			label: "Historical Performance",
			score: matchmaking.historicalPerformance,
			explanation: matchmaking.historicalPerformanceExplanation,
		},
		{
			label: "Price & Value",
			score: matchmaking.priceAndValue,
			explanation: matchmaking.priceAndValueExplanation,
		},
		{
			label: "Project Risk",
			score: matchmaking.projectRisk,
			explanation: matchmaking.projectRiskExplanation,
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<FontAwesomeIcon icon={faLeaf} className="text-emerald-600" />
					Matchmaking Breakdown & Fit Analysis
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-xs">
				{criteria.map((c) => (
					<div
						key={c.label}
						className="space-y-1 rounded-lg border border-border p-3"
					>
						<div className="flex justify-between font-semibold">
							<span>{c.label}</span>
							<span className="text-emerald-600">{c.score}%</span>
						</div>
						<p className="text-muted-foreground">{c.explanation}</p>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
