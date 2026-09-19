import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { formatRupiah } from "../lib/format";

interface ClosedBidCardProps {
	title: string;
	submittedPrice: number;
	statusDescription?: string;
}

export function ClosedBidCard({
	title,
	submittedPrice,
	statusDescription = "Bid locked and under blind evaluation.",
}: ClosedBidCardProps) {
	return (
		<Card>
			<CardHeader>
				<Badge
					variant="outline"
					className="w-fit border-blue-500 text-blue-700"
				>
					Closed Bidding
				</Badge>
				<CardTitle className="mt-2 text-lg">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-sm">
				<div className="space-y-1 rounded-lg bg-muted p-3">
					<p className="text-muted-foreground">Your Sealed Bid (Submitted):</p>
					<p className="text-base font-bold text-foreground">
						{formatRupiah(submittedPrice)}
					</p>
					<p className="mt-1 flex items-center gap-1 text-sm text-emerald-700">
						<FontAwesomeIcon icon={faCheckCircle} /> {statusDescription}
					</p>
				</div>
				<p className="text-muted-foreground">
					Closed bidding does not disclose the number of participants or their
					bids, and an offer can only be submitted once.
				</p>
			</CardContent>
		</Card>
	);
}
