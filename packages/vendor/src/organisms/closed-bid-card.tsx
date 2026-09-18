import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@greenshift/ui";
import { formatRupiah } from "../lib/format";

interface ClosedBidCardProps {
	title: string;
	participantCount: number;
	submittedPrice: number;
	statusDescription?: string;
}

export function ClosedBidCard({
	title,
	participantCount,
	submittedPrice,
	statusDescription = "Bid locked & under blind evaluation.",
}: ClosedBidCardProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className="border-blue-500 text-blue-700 dark:text-blue-300"
					>
						Closed Bidding
					</Badge>
					<span className="text-xs text-muted-foreground">
						Participants: {participantCount} Verified Vendors
					</span>
				</div>
				<CardTitle className="mt-2 text-lg">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-xs">
				<div className="space-y-1 rounded-lg bg-muted p-3">
					<p className="text-muted-foreground">
						Your Sealed Bid (Submitted):
					</p>
					<p className="text-base font-bold text-foreground">
						{formatRupiah(submittedPrice)}
					</p>
					<p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
						<FontAwesomeIcon icon={faCheckCircle} /> {statusDescription}
					</p>
				</div>
				<p className="text-muted-foreground">
					Closed bidding does not disclose competitor bids and offers can only be submitted once.
				</p>
			</CardContent>
		</Card>
	);
}
