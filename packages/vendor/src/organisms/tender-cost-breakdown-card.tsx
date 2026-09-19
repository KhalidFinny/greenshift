import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ShimmerBlock,
} from "@greenshift/ui";
import { formatRupiah } from "../lib/format";
import type { CostBreakdown } from "../lib/types";

interface TenderCostBreakdownCardProps {
	costBreakdown: CostBreakdown;
	loading?: boolean;
}

export function TenderCostBreakdownCard({
	costBreakdown,
	loading = false,
}: TenderCostBreakdownCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Commercial Summary</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-sm">
				{loading ? (
					<>
						<ShimmerBlock className="h-5 w-full rounded" />
						<ShimmerBlock className="h-5 w-full rounded" />
					</>
				) : (
					<>
						<div className="flex justify-between border-b border-border pb-2">
							<span className="text-muted-foreground">
								Operational cost reported
							</span>
							<span className="font-semibold">
								{costBreakdown.operationalCost === null
									? "Not reported"
									: formatRupiah(costBreakdown.operationalCost)}
							</span>
						</div>
						<div className="flex justify-between pt-1 font-bold text-[#00712D]">
							<span>Total proposed value</span>
							<span className="tabular-nums">
								{formatRupiah(costBreakdown.totalPrice)}
							</span>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
