import { faFileShield } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ShimmerBlock,
} from "@greenshift/ui";
import {
	formatCount,
	formatPercent,
	formatRupiah,
	formatTonnes,
} from "../lib/format";
import type { VendorBlueprint } from "../lib/types";

interface BlueprintCardProps {
	/** Null while the project carries no validated blueprint. */
	blueprint: VendorBlueprint | null;
	loading?: boolean;
}

/** The stage the document reached, in the words a bidder reads it under. */
const STATUS_LABEL: Record<string, string> = {
	validated: "Validated",
	published: "Validated and published",
};

function Figure({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-border px-3 py-2">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p className="mt-0.5 font-semibold tabular-nums">{value}</p>
		</div>
	);
}

/**
 * The Green Project Blueprint, as the bidder on a tender reads it: the funding
 * case, the emission targets the project was cleared on, and the three scenarios
 * behind the projections.
 *
 * The document is written from the figures the company submitted and travels
 * with the tender, so a vendor bids against the same case the company filed
 * rather than a scope of work alone.
 */
export function BlueprintCard({
	blueprint,
	loading = false,
}: BlueprintCardProps) {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Green Project Blueprint</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<ShimmerBlock className="h-4 w-2/3" />
					<div className="grid gap-3 sm:grid-cols-3">
						{Array.from({ length: 3 }, (_, index) => (
							<ShimmerBlock key={index} className="h-16 w-full" />
						))}
					</div>
					<ShimmerBlock className="h-4 w-5/6" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<FontAwesomeIcon
							icon={faFileShield}
							className="text-primary"
							aria-hidden
						/>
						Green Project Blueprint
					</CardTitle>
					{blueprint ? (
						<Badge variant="secondary">
							{STATUS_LABEL[blueprint.status] ?? blueprint.status}
						</Badge>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				{blueprint === null ? (
					<p className="leading-relaxed text-muted-foreground">
						This project carries no blueprint yet, so the scope of work above is
						what the tender runs on. It appears here as soon as the company
						files it.
					</p>
				) : (
					<>
						<div className="grid gap-3 sm:grid-cols-3">
							<Figure
								label="Project IRR"
								value={
									blueprint.irrPercent === null
										? "Not reached"
										: formatPercent(blueprint.irrPercent)
								}
							/>
							<Figure
								label="Net present value"
								value={formatRupiah(blueprint.npvAmount)}
							/>
							<Figure
								label="Payback"
								value={
									blueprint.paybackYears === null
										? "Not reached"
										: `${blueprint.paybackYears} years`
								}
							/>
						</div>

						{blueprint.emissions ? (
							<div>
								<h4 className="mb-2 font-semibold text-foreground">
									Verified emission targets
								</h4>
								<ul className="space-y-1.5 text-muted-foreground">
									<li>
										Baseline {formatTonnes(blueprint.emissions.baselineTco2)}{" "}
										per year, cut by {blueprint.emissions.targetPct}%.
									</li>
									<li>
										Target {formatTonnes(blueprint.emissions.targetTco2)} per
										year, from{" "}
										{formatCount(blueprint.emissions.energySavingKwh)} kWh of
										annual saving.
									</li>
								</ul>
							</div>
						) : null}

						{blueprint.funding ? (
							<div>
								<h4 className="mb-2 font-semibold text-foreground">
									Funding structure
								</h4>
								<ul className="space-y-1.5 text-muted-foreground">
									<li>
										Capital {formatRupiah(blueprint.funding.capexRp)} over a{" "}
										{blueprint.funding.tenorYears}-year green bond, repaid from
										an annual saving of{" "}
										{formatRupiah(blueprint.funding.annualSavingRp)}.
									</li>
									{blueprint.funding.collateral ? (
										<li>Collateral offered: {blueprint.funding.collateral}.</li>
									) : null}
								</ul>
							</div>
						) : null}

						{blueprint.scenarios.length > 0 ? (
							<div>
								<h4 className="mb-2 font-semibold text-foreground">
									Scenarios
								</h4>
								<div className="overflow-x-auto">
									<table className="w-full text-left">
										<thead>
											<tr className="text-muted-foreground">
												<th className="py-1.5 pr-4 font-medium">Case</th>
												<th className="py-1.5 pr-4 font-medium">
													Net present value
												</th>
												<th className="py-1.5 font-medium">Project IRR</th>
											</tr>
										</thead>
										<tbody>
											{blueprint.scenarios.map((scenario) => (
												<tr
													key={scenario.key}
													className="border-t border-border"
												>
													<td className="py-1.5 pr-4">
														{scenario.label} · {scenario.savingPct}% of plan
													</td>
													<td className="py-1.5 pr-4 tabular-nums">
														{formatRupiah(scenario.npvAmount)}
													</td>
													<td className="py-1.5 tabular-nums">
														{scenario.irrPercent === null
															? "Not reached"
															: formatPercent(scenario.irrPercent)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						) : null}
					</>
				)}
			</CardContent>
		</Card>
	);
}
