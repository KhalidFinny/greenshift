import { faGavel } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
} from "@greenshift/ui";
import { useState } from "react";
import type { OpenBidLeaderboardEntry } from "../lib/types";
import { formatRupiah } from "../lib/format";

interface OpenBidLeaderboardProps {
	leaderboard: OpenBidLeaderboardEntry[];
	projectTitle: string;
	projectClient: string;
	deadline: string;
	onRevise: (newPrice: number) => void;
}

function ReviseOpenBidDialog({
	currentPrice,
	onRevise,
}: {
	currentPrice: number;
	onRevise: (newPrice: number) => void;
}) {
	const [open, setOpen] = useState(false);
	const [priceInput, setPriceInput] = useState(currentPrice.toString());

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const val = Number(priceInput);
		if (val > 0) {
			onRevise(val);
			setOpen(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="bg-[#03442C] text-white hover:bg-[#03442C]/90">
					Revise Bid Price
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faGavel} className="text-emerald-600" />
						Revise Open Bidding Offer
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 pt-2">
					<div className="space-y-1 rounded-lg bg-muted p-3 text-xs">
						<p className="text-muted-foreground">Current Bid Price:</p>
						<p className="text-sm font-bold text-foreground">
							{formatRupiah(currentPrice)}
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="bid-price" className="text-xs font-semibold">
							New Bid Price (IDR):
						</Label>
						<Input
							id="bid-price"
							type="number"
							value={priceInput}
							onChange={(e) => setPriceInput(e.target.value)}
							placeholder="Enter new bid amount..."
							required
						/>
						<p className="text-[11px] text-muted-foreground">
							The open bidding system displays the current ranking dynamically
							without displaying previous price revision history.
						</p>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button
							type="submit"
							className="bg-[#03442C] text-white hover:bg-[#03442C]/90"
						>
							Submit Revised Bid
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function OpenBidLeaderboard({
	leaderboard,
	projectTitle,
	projectClient,
	deadline,
	onRevise,
}: OpenBidLeaderboardProps) {
	const currentVendorBid = leaderboard.find((item) => item.isCurrentVendor);
	const lowestBid = leaderboard[0];

	// Anonymize competitor names: Vendor A, Vendor B, etc. Keep (You) for current vendor
	let competitorIndex = 0;
	const formattedLeaderboard = leaderboard.map((item) => {
		if (item.isCurrentVendor) {
			const name = item.vendorName.includes("(You)")
				? item.vendorName
				: `${item.vendorName.replace(/\s*\(Anda\)/i, "")} (You)`;
			return { ...item, displayName: name };
		}
		// Anonymized competitor label
		const letter = String.fromCharCode(65 + competitorIndex);
		competitorIndex++;
		return { ...item, displayName: `Vendor ${letter}` };
	});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<div className="flex items-center gap-2">
						<Badge className="bg-emerald-600 text-white">
							Open Bidding
						</Badge>
						<span className="text-xs text-muted-foreground">
							Ends {deadline}
						</span>
					</div>
					<CardTitle className="mt-2 text-lg">{projectTitle}</CardTitle>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Client: {projectClient}
					</p>
				</div>
				{currentVendorBid && (
					<ReviseOpenBidDialog
						currentPrice={currentVendorBid.currentPrice}
						onRevise={onRevise}
					/>
				)}
			</CardHeader>
			<CardContent className="space-y-4 text-xs">
				<div className="overflow-hidden rounded-xl border border-border">
					<div className="flex items-center justify-between bg-muted px-4 py-3 text-xs font-semibold">
						<span>Live Open Bidding Standings</span>
						<span>Current Lowest: {formatRupiah(lowestBid?.currentPrice)}</span>
					</div>
					<div className="divide-y divide-border">
						{formattedLeaderboard.map((item) => (
							<div
								key={item.vendorName}
								className={`flex items-center justify-between p-4 ${
									item.isCurrentVendor
										? "bg-emerald-50/70 font-semibold dark:bg-emerald-950/40"
										: ""
								}`}
							>
								<div className="flex items-center gap-3">
									<div
										className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
											item.rank === 1
												? "bg-amber-400 text-amber-950"
												: "bg-muted text-muted-foreground"
										}`}
									>
										{item.rank}
									</div>
									<div>
										<p className="text-sm font-medium text-foreground">
											{item.displayName}
										</p>
										<p className="text-[11px] text-muted-foreground">
											Updated:{" "}
											{new Date(item.updatedAt).toLocaleTimeString("en-US", {
												timeStyle: "short",
											})}
										</p>
									</div>
								</div>
								<div className="text-right">
									<p className="text-sm font-bold text-foreground">
										{formatRupiah(item.currentPrice)}
									</p>
									{item.isCurrentVendor && (
										<Badge className="mt-0.5 bg-emerald-600 text-[10px] text-white">
											Your Bid
										</Badge>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
				<p className="text-[11px] italic text-muted-foreground">
					* Note: Open bidding displays real-time ranking only. Competitor identities are anonymized and previous revision histories are not shown.
				</p>
			</CardContent>
		</Card>
	);
}
