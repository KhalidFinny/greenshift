import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { formatIdr } from "../lib/format";
import { portfolioTotals } from "../lib/portfolio-metrics";
import type { PortfolioItem } from "@greenshift/api/contracts";
import { HoldingsTable } from "./holdings-table";

interface HoldingsPanelProps {
	items: PortfolioItem[];
	interactive: boolean;
	title: string;
}

function StatTile({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-md border border-border/70 px-3 py-2">
			<p className="text-base text-muted-foreground">{label}</p>
			<p className="mt-1 text-lg font-semibold leading-none tabular-nums">{value}</p>
		</div>
	);
}

export function HoldingsPanel({ items, interactive, title }: HoldingsPanelProps) {
	const totals = portfolioTotals(items);

	return (
		<Card>
			<CardHeader className="space-y-4">
				<CardTitle className="text-lg">{title}</CardTitle>
				<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
					<StatTile label="Obligasi" value={String(items.length)} />
					<StatTile label="Aktif" value={String(totals.activeBonds)} />
					<StatTile label="ROI Diterima" value={formatIdr(totals.roiPaid)} />
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<HoldingsTable items={items} interactive={interactive} />
			</CardContent>
		</Card>
	);
}
