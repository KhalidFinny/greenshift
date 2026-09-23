import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
	ShimmerBlock,
} from "@greenshift/ui";
import { MATCH_CRITERIA, matchStrength } from "../lib/matchmaking";
import type { MatchmakingBreakdown } from "../lib/types";

interface MatchmakingDeepDiveProps {
	/** Null when the matching model has not scored this project for the vendor. */
	matchmaking?: MatchmakingBreakdown | null;
	/** Scores still in flight: same card, shimmering values. */
	loading?: boolean;
}

export function MatchmakingDeepDive({
	matchmaking,
	loading = false,
}: MatchmakingDeepDiveProps) {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">
						Matchmaking Breakdown & Fit Analysis
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-8 sm:flex-row">
						<div className="flex shrink-0 flex-col items-center justify-center">
							<div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-emerald-700 bg-emerald-50">
								<ShimmerBlock className="h-12 w-16" />
							</div>
							<p className="mt-3 text-sm font-medium text-muted-foreground">
								Overall Match
							</p>
						</div>
						<div className="flex-1 space-y-4">
							{MATCH_CRITERIA.map((criterion) => (
								<div key={criterion.key} className="space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-foreground">
											{criterion.label}
										</span>
										<ShimmerBlock className="h-4 w-10" />
									</div>
									<ShimmerBlock className="h-2 w-full rounded-full" />
									<ShimmerBlock className="h-4 w-11/12" />
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!matchmaking) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">
						Matchmaking Breakdown & Fit Analysis
					</CardTitle>
				</CardHeader>
				<CardContent>
					<EmptyState
						title="Not scored yet"
						description="Once the matching model has scored this project against your profile, the five criteria and your rank appear here."
					/>
				</CardContent>
			</Card>
		);
	}

	const strength = matchStrength(matchmaking.overallMatch);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">
					Matchmaking Breakdown & Fit Analysis
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-8 sm:flex-row">
					<div className="flex shrink-0 flex-col items-center justify-center">
						<div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-emerald-700 bg-emerald-50">
							<span className="text-5xl font-bold leading-none text-emerald-700">
								{matchmaking.overallMatch}
							</span>
						</div>
						<p className="mt-3 text-sm font-medium text-muted-foreground">
							Overall Match
						</p>
						<p className="text-sm text-muted-foreground">
							{strength.label} · rank {matchmaking.rank}
						</p>
					</div>

					<div className="flex-1 space-y-4">
						{MATCH_CRITERIA.map((criterion) => {
							// Stored criteria are unrounded; the screen shows whole percentages, the way the total reads.
							const score = Math.round(matchmaking[criterion.key]);
							return (
								<div key={criterion.key} className="space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-foreground">
											{criterion.label}
										</span>
										<span className="text-sm font-bold text-emerald-700">
											{score}%
										</span>
									</div>
									<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-emerald-700"
											style={{ width: `${score}%` }}
										/>
									</div>
									<p className="text-sm text-muted-foreground">
										{criterion.explanation}
									</p>
								</div>
							);
						})}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
