import { Card, CardContent, CardHeader, CardTitle } from "@greenshift/ui";
import { formatRupiah } from "../lib/format";
import type { CostBreakdown } from "../lib/types";

interface TenderCostBreakdownCardProps {
	costBreakdown: CostBreakdown;
}

export function TenderCostBreakdownCard({
	costBreakdown,
}: TenderCostBreakdownCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Commercial Cost Breakdown</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-xs">
				<div className="flex justify-between border-b border-border pb-2">
					<span className="text-muted-foreground">Primary Equipment</span>
					<span className="font-semibold">
						{formatRupiah(costBreakdown.equipmentCost)}
					</span>
				</div>
				<div className="flex justify-between border-b border-border pb-2">
					<span className="text-muted-foreground">Installation & Mounting</span>
					<span className="font-semibold">
						{formatRupiah(costBreakdown.installationCost)}
					</span>
				</div>
				<div className="flex justify-between border-b border-border pb-2">
					<span className="text-muted-foreground">Engineering Labor</span>
					<span className="font-semibold">
						{formatRupiah(costBreakdown.laborCost)}
					</span>
				</div>
				<div className="flex justify-between border-b border-border pb-2">
					<span className="text-muted-foreground">Testing & Commissioning</span>
					<span className="font-semibold">
						{formatRupiah(costBreakdown.operationalCost)}
					</span>
				</div>
				<div className="flex justify-between pt-1 text-sm font-bold text-[#03442C] dark:text-emerald-400">
					<span>Total Investment Value</span>
					<span>{formatRupiah(costBreakdown.totalPrice)}</span>
				</div>
			</CardContent>
		</Card>
	);
}
