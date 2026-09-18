import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { formatRupiah } from "../lib/format";
import type { NegotiationRequest, VendorProjectCardData } from "../lib/types";

interface ActionRequiredCardProps {
	negotiations: NegotiationRequest[];
	projects: VendorProjectCardData[];
	leaderboard: { rank: number; isCurrentVendor: boolean }[];
}

export function ActionRequiredCard({
	negotiations,
	projects,
	leaderboard,
}: ActionRequiredCardProps) {
	const firstNeg = negotiations[0];
	const currentVendorRank = leaderboard.find((e) => e.isCurrentVendor)?.rank;
	const firstOpenBidProject = projects.find(
		(p) => p.procurementMethod === "OPEN_BIDDING",
	);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-lg">Requiring Action</CardTitle>
				<Link
					to="/vendor/opportunities"
					className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
				>
					View All Opportunities
				</Link>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Active Negotiation */}
				{firstNeg && (
					<div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800/50 dark:bg-blue-950/30">
						<div className="flex items-start justify-between">
							<div>
								<Badge className="bg-blue-600 text-white">
									Negotiation Request ({firstNeg.iterationNumber}/
									{firstNeg.maxIterations})
								</Badge>
								<h4 className="mt-2 font-semibold">{firstNeg.projectTitle}</h4>
								<p className="mt-1 text-sm text-muted-foreground">
									Client: {firstNeg.companyName}
								</p>
								<p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
									"{firstNeg.companyNote}"
								</p>
							</div>
							<Link to="/vendor/deals">
								<Button
									size="sm"
									className="bg-blue-600 text-white hover:bg-blue-700"
								>
									Respond to Negotiation
								</Button>
							</Link>
						</div>
					</div>
				)}

				{/* Open Bidding Status */}
				{firstOpenBidProject && (
					<div className="rounded-xl border border-border p-4">
						<div className="flex items-start justify-between">
							<div>
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className="border-emerald-500 text-emerald-700 dark:text-emerald-300"
									>
										Open Bidding
									</Badge>
									<span className="flex items-center gap-1 text-xs text-muted-foreground">
										<FontAwesomeIcon icon={faClock} />
										Ends{" "}
										{new Date(
											firstOpenBidProject.tenderDeadlineAt,
										).toLocaleDateString("en-US", { dateStyle: "medium" })}
									</span>
								</div>
								<h4 className="mt-2 font-semibold">
									{firstOpenBidProject.title}
								</h4>
								<p className="mt-1 text-sm text-muted-foreground">
									Budget:{" "}
									<span className="font-semibold text-foreground">
										{formatRupiah(firstOpenBidProject.estimatedValue)}
									</span>
									{currentVendorRank && (
										<>
											{" "}
											• Your Standing:{" "}
											<span className="font-semibold text-foreground">
												Rank {currentVendorRank} of {leaderboard.length} Vendors
											</span>
										</>
									)}
								</p>
							</div>
							<Link to="/vendor/opportunities">
								<Button size="sm" variant="outline">
									Revise Bid
								</Button>
							</Link>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
