import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
} from "@greenshift/ui";
import { formatRupiah } from "../lib/format";
import { useVendorData } from "../lib/use-vendor-data";
import { DetailHero, DetailShell } from "../organisms/detail-shell";

const NOT_RECORDED = "Not recorded";

export function VendorPortfolioItemDetailPage({ itemId }: { itemId?: string }) {
	const { isLoading, portfolio } = useVendorData();

	const item = portfolio.find((i) => i.id === itemId) ?? portfolio[0];

	if (!isLoading && !item) {
		return (
			<DetailShell
				backTo="/vendor/portfolio"
				backLabel="Back to Portfolio"
				hero={null}
			>
				<EmptyState
					title="Record not found"
					description="This portfolio record is no longer on file. It may have been removed."
				/>
			</DetailShell>
		);
	}

	const documentUrl = item?.documentUrl ?? null;

	const facts: {
		label: string;
		value: string;
		documentUrl?: string | null;
	}[] = [
		{ label: "Client", value: item?.clientName || NOT_RECORDED },
		{ label: "Location", value: item?.location || NOT_RECORDED },
		{ label: "Sector", value: item?.projectType || NOT_RECORDED },
		{
			label: "Services provided",
			value: item?.servicesProvided || NOT_RECORDED,
		},
		{
			label: "Duration",
			value:
				item?.durationMonths !== null && item?.durationMonths !== undefined
					? `${item.durationMonths} months`
					: NOT_RECORDED,
		},
		{
			label: "Completed",
			value:
				item?.completionYear !== null && item?.completionYear !== undefined
					? String(item.completionYear)
					: NOT_RECORDED,
		},
		{
			label: "Document",
			value: documentUrl ? item?.documentName || "Document" : NOT_RECORDED,
			documentUrl,
		},
	];

	return (
		<DetailShell
			backTo="/vendor/portfolio"
			backLabel="Back to Portfolio"
			hero={
				<DetailHero
					loading={isLoading}
					title={item?.projectName}
					badges={
						item ? (
							<span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-emerald-200">
								Delivered work
							</span>
						) : null
					}
					meta={
						item?.clientName ? (
							<span className="text-base text-emerald-100/80">
								{item.clientName}
							</span>
						) : null
					}
					stats={[
						{
							label: "Project value",
							value: formatRupiah(item?.projectValue),
						},
						{
							label: "Carbon reduction",
							value:
								item?.carbonReductionTons !== null &&
								item?.carbonReductionTons !== undefined
									? `${item.carbonReductionTons} tCO₂e/yr`
									: "Not reported",
							tone: "positive",
						},
						{
							label: "Energy saved",
							value:
								item?.energySavingKwh !== null &&
								item?.energySavingKwh !== undefined
									? `${item.energySavingKwh.toLocaleString("en-US")} kWh/yr`
									: item?.energySavingPercent !== null &&
											item?.energySavingPercent !== undefined
										? `${item.energySavingPercent}%`
										: "Not reported",
							tone: "positive",
						},
						{
							label: "Completion year",
							value:
								item?.completionYear !== null &&
								item?.completionYear !== undefined
									? String(item.completionYear)
									: "Not reported",
						},
					]}
				/>
			}
		>
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Project record</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6 text-sm">
					{item?.description ? (
						<p className="whitespace-pre-line leading-relaxed text-muted-foreground">
							{item.description}
						</p>
					) : (
						<p className="text-muted-foreground">
							No written description is on file for this project.
						</p>
					)}

					<dl className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
						{facts.map((fact) => {
							const url = fact.documentUrl;
							return (
								<div
									key={fact.label}
									className="flex items-baseline justify-between gap-4 border-b border-border pb-2"
								>
									<dt className="text-muted-foreground">{fact.label}</dt>
									<dd className="text-right font-medium text-foreground">
										{url ? (
											<button
												type="button"
												className="cursor-pointer font-medium text-blue-700 hover:underline"
												onClick={() => window.open(url, "_blank", "noopener")}
											>
												{fact.value}
											</button>
										) : (
											fact.value
										)}
									</dd>
								</div>
							);
						})}
					</dl>
				</CardContent>
			</Card>
		</DetailShell>
	);
}
