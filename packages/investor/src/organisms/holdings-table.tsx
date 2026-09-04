import type { PortfolioItem } from "@greenshift/api/contracts";
import {
	Badge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { formatIdr, titleCase } from "../lib/format";
import {
	INVEST_STATUS_LABEL,
	INVEST_STATUS_TONE,
	STATUS_BADGE_CLASS,
} from "../lib/labels";

interface HoldingsTableProps {
	items: PortfolioItem[];
	/** Newest-first preview cap (undefined = all rows). */
	limit?: number;
	/**
	 * When false (demo fixtures) the project title is plain text — demo ids
	 * don't exist server-side, so a detail link would 404.
	 */
	interactive?: boolean;
}

export function HoldingsTable({
	items,
	limit,
	interactive = true,
}: HoldingsTableProps) {
	const rows = [...items]
		.sort((a, b) => {
			const aAt = a.investment.investedAt ?? "";
			const bAt = b.investment.investedAt ?? "";
			return bAt.localeCompare(aAt) || b.investment.id - a.investment.id;
		})
		.slice(0, limit);

	return (
		<div className="overflow-x-auto">
			<Table className="text-base">
				<TableHeader>
					<TableRow>
						<TableHead>Obligasi</TableHead>
						<TableHead>Proyek</TableHead>
						<TableHead className="text-right">IRR</TableHead>
						<TableHead className="text-right">Tenor</TableHead>
						<TableHead className="text-right">Investasi</TableHead>
						<TableHead className="text-right">ROI Diterima</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map(({ investment, project, blueprint }) => (
						<TableRow key={investment.id}>
							<TableCell className="tabular-nums">
								{investment.bondSerialNumber ?? "—"}
							</TableCell>
							<TableCell>
								{interactive ? (
									<Link
										to="/investor/portfolio/$id"
										params={{ id: String(investment.id) }}
										className="font-medium no-underline transition-colors hover:text-primary"
									>
										{project.title}
									</Link>
								) : (
									<p className="font-medium">{project.title}</p>
								)}
								<p className="mt-0.5 text-base text-muted-foreground">
									{titleCase(project.industrySector ?? "Umum")} ·{" "}
									{project.location ?? "—"}
								</p>
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{typeof blueprint.irr === "number"
									? `${blueprint.irr.toLocaleString("id-ID", {
											maximumFractionDigits: 1,
										})}%`
									: "—"}
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{typeof blueprint.paybackPeriod === "number"
									? `${blueprint.paybackPeriod} thn`
									: "—"}
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{formatIdr(investment.amount)}
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{formatIdr(investment.roiPaid)}
							</TableCell>
							<TableCell>
								<Badge
									variant={INVEST_STATUS_TONE[investment.status] ?? "outline"}
									className={STATUS_BADGE_CLASS}
								>
									{INVEST_STATUS_LABEL[investment.status] ?? investment.status}
								</Badge>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
