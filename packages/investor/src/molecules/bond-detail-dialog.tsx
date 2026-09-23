import {
	faArrowUpRightFromSquare,
	faChartLine,
	faFileShield,
	faGaugeHigh,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { BondListing } from "@greenshift/api/contracts";
import {
	Badge,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@greenshift/ui";
import {
	formatDate,
	formatIdr,
	formatNumber,
	formatTonnes,
	monthLabel,
	titleCase,
} from "../lib/format";
import { riskMeta } from "../lib/labels";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2.5">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="text-right text-sm font-medium tabular-nums">{value}</dd>
		</div>
	);
}

/** Facts pair up from sm, so a wide dialog reads as two columns; a narrow one stacks them. */
function Facts({ children }: { children: React.ReactNode }) {
	return <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{children}</dl>;
}

/* Shared by the scenario table and its narrow-width stack, so the two cannot state a case differently. */
function irrLabel(value: number | null | undefined): string {
	return value === null || value === undefined ? "Not reached" : `${value}%`;
}

function paybackLabel(value: number | null | undefined): string {
	return value === null || value === undefined ? "Not reached" : `${value} yr`;
}

type Scenario = NonNullable<BondListing["blueprint"]>["scenarios"][number];

/** Below sm five columns have no room, so each case reads as its own block instead. */
function ScenarioStack({ scenarios }: { scenarios: Scenario[] }) {
	return (
		<ul className="space-y-3 sm:hidden">
			{scenarios.map((scenario) => (
				<li
					key={scenario.key}
					className="rounded-lg border border-border px-4 py-3"
				>
					<p className="text-sm font-semibold">{scenario.label}</p>
					<dl className="mt-2 space-y-2 text-sm">
						<Row label="Saving assumed" value={`${scenario.savingPct}%`} />
						<Row label="Net present value" value={formatIdr(scenario.npvRp)} />
						<Row label="IRR" value={irrLabel(scenario.irrPct)} />
						<Row label="Payback" value={paybackLabel(scenario.paybackYears)} />
					</dl>
				</li>
			))}
		</ul>
	);
}

function ScenarioTable({ scenarios }: { scenarios: Scenario[] }) {
	return (
		<div className="hidden overflow-x-auto sm:block">
			<table className="w-full text-left text-sm">
				<thead>
					<tr className="border-b border-border text-muted-foreground">
						<th className="py-2.5 pr-4 font-medium">Case</th>
						<th className="py-2.5 pr-4 font-medium">Saving assumed</th>
						<th className="py-2.5 pr-4 font-medium">Net present value</th>
						<th className="py-2.5 pr-4 font-medium">IRR</th>
						<th className="py-2.5 font-medium">Payback</th>
					</tr>
				</thead>
				<tbody>
					{scenarios.map((scenario) => (
						<tr
							key={scenario.key}
							className="border-b border-border/60 last:border-0"
						>
							<td className="py-2.5 pr-4 font-medium">{scenario.label}</td>
							<td className="py-2.5 pr-4 tabular-nums">
								{scenario.savingPct}%
							</td>
							<td className="py-2.5 pr-4 tabular-nums">
								{formatIdr(scenario.npvRp)}
							</td>
							<td className="py-2.5 pr-4 tabular-nums">
								{irrLabel(scenario.irrPct)}
							</td>
							<td className="py-2.5 tabular-nums">
								{paybackLabel(scenario.paybackYears)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function Section({
	title,
	icon,
	children,
}: {
	title: string;
	icon: typeof faGaugeHigh;
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-4">
			<h3 className="flex items-center gap-2.5 border-b border-border pb-3 text-lg font-semibold">
				<FontAwesomeIcon
					icon={icon}
					className="size-4 text-[#03442C]"
					aria-hidden
				/>
				{title}
			</h3>
			{children}
		</section>
	);
}

function Missing({ children }: { children: React.ReactNode }) {
	return (
		<p className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
			{children}
		</p>
	);
}

/** The listing's own detail preview; a section with nothing on file says so instead of showing a plausible number. */
export function BondDetailDialog({ listing }: { listing: BondListing }) {
	const blueprint = listing.blueprint;
	const terms = listing.bondTerms;
	const risk = riskMeta(listing.riskScore);
	const baseCase =
		blueprint?.scenarios.find((scenario) => scenario.key === "base") ?? null;
	const npv = blueprint?.npv ?? baseCase?.npvRp;
	const irr = blueprint?.irr ?? baseCase?.irrPct ?? undefined;
	const payback =
		blueprint?.paybackPeriod ?? baseCase?.paybackYears ?? undefined;

	const annualCoupon =
		terms?.amount != null && terms.couponRatePercent != null
			? (terms.amount * terms.couponRatePercent) / 100
			: null;
	const tenorYears = terms?.tenorMonths != null ? terms.tenorMonths / 12 : null;
	const totalCoupons =
		annualCoupon != null && tenorYears != null
			? annualCoupon * tenorYears
			: null;
	const totalAtMaturity =
		totalCoupons != null && terms?.amount != null
			? terms.amount + totalCoupons
			: null;

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" className="w-full gap-2">
					<FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden />
					View details
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] gap-6 overflow-y-auto p-5 sm:max-w-3xl sm:p-6">
				<DialogHeader className="gap-2 border-b border-border pr-8 pb-5">
					<DialogTitle className="flex flex-wrap items-center gap-3 text-xl">
						{listing.title}
						<Badge variant="secondary" className="rounded-md px-3 !h-8 text-sm">
							{listing.status === "verified" ? "Verified" : "On progress"}
						</Badge>
					</DialogTitle>
					<DialogDescription className="text-sm leading-relaxed">
						{listing.companyName ?? "Company not recorded"} ·{" "}
						{listing.industrySector
							? titleCase(listing.industrySector)
							: "Sector not recorded"}{" "}
						· {listing.location ?? "Location not recorded"}
						{listing.bondCode ? ` · ${listing.bondCode}` : ""}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-7">
					<Section title="Risk" icon={faGaugeHigh}>
						<Facts>
							<Row
								label="Rating"
								value={
									<Badge
										variant={risk.tone}
										className="rounded-md px-2.5 !h-7 text-sm"
									>
										{risk.label}
									</Badge>
								}
							/>
							<Row
								label="Score"
								value={
									listing.riskScore === null
										? "Not scored"
										: `${listing.riskScore} / 100`
								}
							/>
						</Facts>
						<p className="text-sm leading-relaxed text-muted-foreground">
							The platform's readiness score for the project, over its
							financial, technical, implementation and environmental factors. A
							lower score is lower risk.
						</p>
					</Section>

					<Section title="Project details" icon={faChartLine}>
						<Facts>
							<Row
								label="Target emission reduction"
								value={
									listing.targetEmissionReduction === null
										? "Not set"
										: `${formatTonnes(listing.targetEmissionReduction)} / yr`
								}
							/>
							<Row
								label="Estimated energy saving"
								value={
									listing.estimatedEnergySaving === null
										? "Not set"
										: `${formatNumber(listing.estimatedEnergySaving)} kWh / yr`
								}
							/>
							<Row
								label="Verified"
								value={
									listing.verifiedAt
										? formatDate(listing.verifiedAt)
										: "Not yet"
								}
							/>
							<Row
								label="MRV periods reported"
								value={String(listing.monitoring.periods)}
							/>
							<Row
								label="Verified reduction to date"
								value={formatTonnes(listing.monitoring.verifiedTco2)}
							/>
							<Row
								label="Latest period"
								value={
									listing.monitoring.latestPeriod
										? monthLabel(listing.monitoring.latestPeriod)
										: "None reported"
								}
							/>
						</Facts>
						<p
							className={cn(
								"text-sm leading-relaxed",
								listing.monitoring.anomalyFlagged
									? "text-destructive"
									: "text-emerald-700",
							)}
						>
							{listing.monitoring.periods === 0
								? "Monitoring starts with the project's first reported period."
								: listing.monitoring.anomalyFlagged
									? "A reported period deviated from its baseline and is flagged for technical review."
									: "Every reported period has held its baseline."}
						</p>
					</Section>

					<Section title="Blueprint" icon={faFileShield}>
						{blueprint === null ? (
							<Missing>
								This project's blueprint is not published yet, so the funding
								case and its targets are not public. It appears here once the
								validator clears it.
							</Missing>
						) : (
							<Facts>
								<Row
									label="Validated"
									value={
										blueprint.validatedAt
											? formatDate(blueprint.validatedAt)
											: "Date not recorded"
									}
								/>
								{blueprint.emissionTargets ? (
									<>
										<Row
											label="Baseline emissions"
											value={`${formatTonnes(blueprint.emissionTargets.baselineTco2)} / yr`}
										/>
										<Row
											label="Target cut"
											value={`${blueprint.emissionTargets.targetPct}%`}
										/>
										<Row
											label="Target emissions"
											value={`${formatTonnes(blueprint.emissionTargets.targetTco2)} / yr`}
										/>
										<Row
											label="Annual energy saving"
											value={`${formatNumber(blueprint.emissionTargets.energySavingKwh)} kWh`}
										/>
									</>
								) : null}
								{blueprint.fundingStructure ? (
									<>
										<Row
											label="Capital"
											value={formatIdr(blueprint.fundingStructure.capexRp)}
										/>
										<Row
											label="Tenor"
											value={`${blueprint.fundingStructure.tenorYears} years`}
										/>
										<Row
											label="Annual saving"
											value={formatIdr(
												blueprint.fundingStructure.annualSavingRp,
											)}
										/>
										{blueprint.fundingStructure.annualRevenueRp !== null ? (
											<Row
												label="Annual revenue"
												value={formatIdr(
													blueprint.fundingStructure.annualRevenueRp,
												)}
											/>
										) : null}
										{blueprint.fundingStructure.collateral ? (
											<Row
												label="Collateral"
												value={blueprint.fundingStructure.collateral}
											/>
										) : null}
									</>
								) : null}
							</Facts>
						)}
					</Section>

					<Section title="ROI projections" icon={faChartLine}>
						{blueprint === null ? (
							<Missing>
								The projections are part of the blueprint, so they become public
								with it.
							</Missing>
						) : (
							<>
								<Facts>
									<Row
										label="Discount rate"
										value={
											blueprint.discountRatePct === null
												? "Not stated"
												: `${blueprint.discountRatePct}%`
										}
									/>
									<Row
										label="Horizon"
										value={
											blueprint.horizonYears === null
												? "Not stated"
												: `${blueprint.horizonYears} years`
										}
									/>
									<Row
										label="Net present value"
										value={npv === undefined ? "Not projected" : formatIdr(npv)}
									/>
									<Row label="Project IRR" value={irrLabel(irr)} />
									<Row
										label="Payback"
										value={
											payback === undefined || payback === null
												? "Not reached"
												: `${payback} years`
										}
									/>
								</Facts>

								{blueprint.scenarios.length > 0 ? (
									<>
										<ScenarioStack scenarios={blueprint.scenarios} />
										<ScenarioTable scenarios={blueprint.scenarios} />
									</>
								) : null}
							</>
						)}
					</Section>

					<Section title="Trading projections" icon={faChartLine}>
						{terms === null ? (
							<Missing>
								No bond has been issued for this project yet, so there are no
								terms to project. The instrument is issued, sold and held by a
								licensed securities partner.
							</Missing>
						) : (
							<>
								<Facts>
									<Row
										label="Issuance status"
										value={terms.status ?? "Not recorded"}
									/>
									<Row label="Face amount" value={formatIdr(terms.amount)} />
									<Row
										label="Coupon rate"
										value={
											terms.couponRatePercent === null
												? "Not recorded"
												: `${terms.couponRatePercent}% / yr`
										}
									/>
									<Row
										label="Tenor"
										value={
											terms.tenorMonths === null
												? "Not recorded"
												: `${terms.tenorMonths} months`
										}
									/>
									<Row label="Issued" value={formatDate(terms.issuanceDate)} />
									<Row label="Matures" value={formatDate(terms.maturityDate)} />
									<Row
										label="Projected coupon, per year"
										value={
											annualCoupon === null
												? "Needs amount and rate"
												: formatIdr(annualCoupon)
										}
									/>
									<Row
										label="Projected coupons over the tenor"
										value={
											totalCoupons === null
												? "Needs amount, rate and tenor"
												: formatIdr(totalCoupons)
										}
									/>
									<Row
										label="Projected total at maturity"
										value={
											totalAtMaturity === null
												? "Needs amount, rate and tenor"
												: formatIdr(totalAtMaturity)
										}
									/>
								</Facts>
								<p className="text-sm leading-relaxed text-muted-foreground">
									These are the terms the platform records from the broker's
									issuance. The bond is traded and held in the securities
									partner's app, which is where the position and its payments
									are followed.
								</p>
							</>
						)}
					</Section>
				</div>
			</DialogContent>
		</Dialog>
	);
}
