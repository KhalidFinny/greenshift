import {
	faCircleCheck,
	faGavel,
	faHandshake,
	faMagnifyingGlassChart,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	ApiError,
	api,
	type BusinessMatchmakingDetail,
	type BusinessMatchmakingMethod,
	type BusinessRecommendedVendor,
} from "@greenshift/core";
import {
	Badge,
	Button,
	Card,
	CardContent,
	cn,
	DataTable,
	EmptyState,
	Input,
	ShimmerBlock,
} from "@greenshift/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { formatSubmittedAt } from "../lib/project-display";
import {
	deadlinePhrase,
	defaultDeadline,
	ModelCard,
	ProjectFacts,
	StageBand,
	stageIndex,
	stageSummary,
	TENDER_STATUS_LABEL,
	toLocalInput,
	VendorCriteria,
	VendorRecord,
} from "./matchmaking-shared";

const ROUTE_ICONS = {
	open: faMagnifyingGlassChart,
	closed: faGavel,
	direct: faHandshake,
} as const satisfies Record<BusinessMatchmakingMethod, unknown>;

const CELL = "px-6 py-5";

export function MatchmakingDetail({ projectId }: { projectId: string }) {
	const id = Number(projectId);

	const detailQuery = useQuery({
		queryKey: ["business", "matchmaking", id],
		enabled: Number.isInteger(id),
		queryFn: async () => api.business.matchmakingDetail(id),
	});

	if (detailQuery.isPending) {
		return (
			<div className="space-y-6">
				<ShimmerBlock className="h-24 w-full rounded-xl" />
				<ShimmerBlock className="h-72 w-full rounded-xl" />
			</div>
		);
	}

	if (detailQuery.isError || !detailQuery.data) {
		// A 404 is the route's own answer; anything else is worth retrying.
		const missing =
			detailQuery.error instanceof ApiError && detailQuery.error.status === 404;
		return (
			<EmptyState
				tone={missing ? "neutral" : "error"}
				title={missing ? "Project not found" : "This project did not load"}
				description={
					missing
						? "It is not one of your projects."
						: "The matchmaking endpoint could not be reached."
				}
				action={
					missing ? (
						<Button asChild>
							<Link to="/business/matchmaking">Back to matchmaking</Link>
						</Button>
					) : (
						<Button variant="outline" onClick={() => detailQuery.refetch()}>
							Try again
						</Button>
					)
				}
			/>
		);
	}

	return <VendorRanking detail={detailQuery.data} projectId={projectId} />;
}

/** Its own component so the columns keep hook order: a hook below the loading return would change it once the query lands. */
function VendorRanking({
	detail,
	projectId,
}: {
	detail: BusinessMatchmakingDetail;
	projectId: string;
}) {
	const id = detail.project.id;
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [vendorId, setVendorId] = useState<number | null>(null);
	const [method, setMethod] = useState<BusinessMatchmakingMethod | null>(null);
	const [deadline, setDeadline] = useState(defaultDeadline);
	const [reading, setReading] = useState<number | null>(null);
	const [busy, setBusy] = useState(false);

	async function act(action: () => Promise<unknown>): Promise<boolean> {
		setBusy(true);
		try {
			await action();
			await queryClient.invalidateQueries({
				queryKey: ["business", "matchmaking"],
			});
			return true;
		} catch {
			// The shared client already reported the failure as a toast.
			return false;
		} finally {
			setBusy(false);
		}
	}

	const { recommendedVendors, matchFactors } = detail;
	const tender = detail.tender;
	const route = method ?? detail.selectedMethod ?? tender?.method ?? null;
	// Once bidding closes the terms are frozen: the bids were made against them.
	const shaping = tender === null || tender.status === "open";
	const winnerName = tender?.awardedVendorName ?? null;
	// The direct route is the only one that names a vendor up front; it runs without competing bids.
	const direct = route === "direct";
	const namedVendor =
		recommendedVendors.find(
			(vendor) => vendor.id === (vendorId ?? detail.selectedVendorId),
		) ?? null;
	const readVendor =
		recommendedVendors.find(
			(vendor) => vendor.id === reading || vendor.name === winnerName,
		) ?? null;
	const bidding = (tender?.bidCount ?? 0) > 0;
	const canOpen =
		route !== null && (route !== "direct" || namedVendor !== null);
	const vendorOutcome =
		winnerName ??
		(direct ? (namedVendor?.name ?? "Not named yet") : null) ??
		(tender === null ? "Not chosen yet" : "Waiting on the bids");

	function toggleRead(vendorId: number) {
		setReading((current) =>
			current === vendorId || (current === null && readVendor?.id === vendorId)
				? null
				: vendorId,
		);
	}

	/** The direct route names the vendor it appoints. It is not an award. */
	function nameVendor(vendor: BusinessRecommendedVendor) {
		setVendorId(vendor.id);
		setReading(vendor.id);
		if (!shaping) return;
		void saveTerms("direct", vendor);
	}

	function chooseRoute(nextMethod: BusinessMatchmakingMethod) {
		setMethod(nextMethod);
		if (!shaping) return;
		if (nextMethod === "direct" && namedVendor === null) return;
		void saveTerms(nextMethod);
	}

	/** The vendor is sent only for the direct route, the one that names one. */
	function saveTerms(
		nextMethod: BusinessMatchmakingMethod | null = route,
		vendor: BusinessRecommendedVendor | null = namedVendor,
	): Promise<boolean> {
		if (nextMethod === null) return Promise.resolve(false);
		if (nextMethod === "direct" && vendor === null) {
			return Promise.resolve(false);
		}
		return act(() =>
			api.business.saveMatchmakingSelection(id, {
				...(nextMethod === "direct" && vendor ? { vendorId: vendor.id } : {}),
				method: nextMethod,
				deadlineAt: new Date(tender?.deadlineAt ?? deadline).toISOString(),
			}),
		);
	}

	async function openTender() {
		const opened = await saveTerms();
		if (!opened) return;
		await navigate({
			to: "/business/matchmaking/$projectId/bidding",
			params: { projectId },
		});
	}

	const columns = useMemo<ColumnDef<BusinessRecommendedVendor>[]>(
		() => [
			{
				id: "rank",
				header: "#",
				meta: { className: cn(CELL, "w-14"), headClassName: cn(CELL, "w-14") },
				cell: ({ row }) => (
					<button
						type="button"
						onClick={(event) => {
							// The row's own click would put it straight back down.
							event.stopPropagation();
							toggleRead(row.original.id);
						}}
						aria-pressed={row.original.id === readVendor?.id}
						aria-label={`Read ${row.original.name}`}
						className="rounded-sm text-sm font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{row.original.rank}
					</button>
				),
			},
			{
				id: "vendor",
				header: "Vendor",
				meta: {
					className: cn(CELL, "w-[26rem] whitespace-normal"),
					headClassName: cn(CELL, "w-[26rem]"),
				},
				cell: ({ row }) => (
					<div className="min-w-0">
						<p className="flex items-center gap-2">
							<span className="truncate text-sm font-medium">
								{row.original.name}
							</span>
							{row.original.verified && (
								<FontAwesomeIcon
									icon={faCircleCheck}
									className="size-4 shrink-0 text-primary"
									aria-label="Verified vendor"
								/>
							)}
						</p>
						<p className="mt-1 text-sm text-muted-foreground">
							{row.original.subtitle}
						</p>
						<p className="mt-2 text-sm leading-6 text-muted-foreground">
							{row.original.whyRank[0] ?? "—"}
						</p>
					</div>
				),
			},
			{
				id: "standing",
				header: "Standing",
				meta: { className: cn(CELL, "w-40"), headClassName: cn(CELL, "w-40") },
				cell: ({ row }) =>
					row.original.name === winnerName ? (
						<Badge className="bg-primary text-primary-foreground">
							Awarded
						</Badge>
					) : row.original.shortlisted ? (
						<Badge className="bg-primary/10 text-primary">Shortlist</Badge>
					) : (
						<span className="text-sm text-muted-foreground">—</span>
					),
			},
			{
				id: "match",
				header: "Match",
				meta: { className: cn(CELL, "w-28"), headClassName: cn(CELL, "w-28") },
				cell: ({ row }) => (
					<div>
						<p className="text-sm font-semibold tabular-nums">
							{row.original.score}
						</p>
						<div className="mt-1.5 h-1.5 w-20 rounded-full bg-muted">
							<div
								className="h-1.5 rounded-full bg-primary"
								style={{ width: `${row.original.score}%` }}
							/>
						</div>
					</div>
				),
			},
			{
				id: "record",
				header: "Record",
				meta: { className: cn(CELL, "w-40"), headClassName: cn(CELL, "w-40") },
				cell: ({ row }) => (
					<div className="text-sm tabular-nums">
						<p className="font-medium">
							{row.original.rating.toFixed(1)} rated
						</p>
						<p className="mt-1 text-muted-foreground">
							{row.original.totalProjects} projects
						</p>
					</div>
				),
			},
			{
				id: "act",
				header: "",
				meta: { className: cn(CELL, "w-40 text-right"), headClassName: CELL },
				cell: ({ row }) =>
					direct ? (
						<Button
							type="button"
							size="sm"
							variant={
								row.original.id === namedVendor?.id ? "default" : "outline"
							}
							onClick={(event) => {
								event.stopPropagation();
								nameVendor(row.original);
							}}
							disabled={!shaping}
						>
							{row.original.id === namedVendor?.id ? "Appointed" : "Appoint"}
						</Button>
					) : null,
			},
		],
		// The row actions close over the on-screen terms, so the columns rebuild when those change.
		[
			deadline,
			detail.selectedVendorId,
			direct,
			namedVendor?.id,
			readVendor?.id,
			route,
			shaping,
			winnerName,
		],
	);

	return (
		<div className="space-y-6">
			<h1 className="text-xl font-semibold">{detail.project.name}</h1>

			<StageBand
				index={stageIndex(detail.selectedVendorId, tender)}
				summary={stageSummary(
					tender,
					winnerName ?? (direct ? namedVendor?.name : null) ?? null,
				)}
				tender={tender}
			>
				<div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-t border-border pt-4">
					<ProjectFacts detail={detail} />
					{shaping && (
						<div className="space-y-3">
							<label
								className="block text-sm font-medium"
								htmlFor="tender-deadline"
							>
								Bidding closes
							</label>
							<Input
								id="tender-deadline"
								type="datetime-local"
								className="w-64"
								value={
									tender?.deadlineAt
										? toLocalInput(new Date(tender.deadlineAt))
										: deadline
								}
								onChange={(event) => setDeadline(event.target.value)}
							/>
						</div>
					)}
				</div>
			</StageBand>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
				<div className="min-w-0 space-y-8">
					<section className="space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
							<h2 className="text-lg font-semibold">Available vendors</h2>
							<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
								<p className="text-sm text-muted-foreground">
									{recommendedVendors.length} scored, {detail.shortlistSize}{" "}
									shortlisted
								</p>
								{bidding && (
									<Button asChild>
										<Link
											to="/business/matchmaking/$projectId/bidding"
											params={{ projectId }}
										>
											{tender?.bidCount === 1
												? "See the vendor bidding"
												: `See the vendors bidding (${tender?.bidCount})`}
										</Link>
									</Button>
								)}
							</div>
						</div>
						{recommendedVendors.length === 0 ? (
							<EmptyState
								title="No ranking for this project yet"
								description="Run the matching to rank the verified vendors against it. The run reads their profiles, so it can be repeated as they change."
								action={
									<Button
										disabled={busy}
										onClick={() => void act(() => api.business.runMatching(id))}
									>
										Run the matching
									</Button>
								}
							/>
						) : (
							<DataTable
								ariaLabel={`Vendors matched to ${detail.project.name}`}
								className="rounded-xl border border-border bg-card"
								columns={columns}
								data={recommendedVendors}
								getRowId={(vendor) => String(vendor.id)}
								pageSize={5}
								onRowClick={(vendor) => toggleRead(vendor.id)}
								rowClassName={(vendor) =>
									vendor.id === readVendor?.id
										? [
												"bg-primary/5",
												"[&>td]:border-y-2 [&>td]:border-y-primary",
												"[&>td:first-child]:border-l-2 [&>td:first-child]:border-l-primary",
												"[&>td:last-child]:border-r-2 [&>td:last-child]:border-r-primary",
											].join(" ")
										: undefined
								}
							/>
						)}
					</section>

					<section className="space-y-3">
						<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
							<h2 className="text-lg font-semibold">Route and window</h2>
							<p className="text-sm text-muted-foreground">
								{shaping
									? "Opening the tender starts the clock."
									: "How it opened."}
							</p>
						</div>
						<div className="grid gap-3 sm:grid-cols-3">
							{detail.procurementMethods.map((option) => {
								const selected = route === option.id;
								return (
									<button
										key={option.id}
										type="button"
										aria-pressed={selected}
										disabled={!shaping}
										onClick={() => chooseRoute(option.id)}
										className={cn(
											"rounded-xl border p-5 text-left transition-colors",
											selected
												? "border-primary bg-primary/5"
												: "border-border hover:bg-muted/50",
											!shaping && "cursor-default opacity-70",
										)}
									>
										<span className="flex items-center justify-between gap-2">
											<FontAwesomeIcon
												icon={ROUTE_ICONS[option.id]}
												className="size-4 text-primary"
												aria-hidden
											/>
											{selected && (
												<FontAwesomeIcon
													icon={faCircleCheck}
													className="size-4 text-primary"
													aria-hidden
												/>
											)}
										</span>
										<span className="mt-3 block text-sm font-semibold">
											{option.label}
										</span>
										<span className="mt-1.5 block text-sm text-muted-foreground">
											{option.desc}
										</span>
									</button>
								);
							})}
						</div>

						<div className="flex flex-wrap items-center gap-3 pt-1">
							{shaping && (
								<Button
									disabled={busy || !canOpen}
									onClick={() => void openTender()}
								>
									{tender
										? "Save and go to the bidding phase"
										: "Open the tender"}
								</Button>
							)}
							{/* A closed tender with no bids has no table button, so the way to its page stays here. */}
							{!shaping && (
								<Button variant="outline" asChild>
									<Link
										to="/business/matchmaking/$projectId/bidding"
										params={{ projectId }}
									>
										Read the bids
									</Link>
								</Button>
							)}
							{shaping && !canOpen && (
								<p className="text-sm text-muted-foreground">
									{route === "direct"
										? "The direct route appoints one vendor: pick it on the row first."
										: "Choose a route to open the tender."}
								</p>
							)}
						</div>

						<div className="grid gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-4">
							{[
								{
									label: "Vendor",
									value: vendorOutcome,
								},
								{
									label: "Route",
									value:
										detail.procurementMethods.find(
											(option) => option.id === route,
										)?.label ?? "Not chosen",
								},
								{
									label: "Tender",
									value: tender
										? (TENDER_STATUS_LABEL[tender.status] ?? tender.status)
										: "Not opened",
								},
								{
									label: "Deadline",
									value: tender?.deadlineAt
										? `${formatSubmittedAt(tender.deadlineAt)} · ${deadlinePhrase(tender.deadlineAt)}`
										: "Not set",
								},
							].map((row) => (
								<div key={row.label} className="min-w-0">
									<dt className="text-sm text-muted-foreground">{row.label}</dt>
									<dd className="truncate text-sm font-semibold">
										{row.value}
									</dd>
								</div>
							))}
						</div>
					</section>
				</div>

				<div className="min-w-0 space-y-6">
					<SelectedVendorPanel vendor={readVendor} />
					{recommendedVendors.length > 0 && (
						<ModelCard factors={matchFactors}>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={busy}
								onClick={() => void act(() => api.business.runMatching(id))}
							>
								Re-run the matching
							</Button>
						</ModelCard>
					)}
				</div>
			</div>
		</div>
	);
}

function SelectedVendorPanel({
	vendor,
}: {
	vendor: BusinessRecommendedVendor | null;
}) {
	return (
		<Card>
			<CardContent className="space-y-4">
				{vendor === null ? (
					<>
						<p className="text-sm font-semibold">Selected vendor</p>
						<p className="text-sm text-muted-foreground">
							Select a vendor to see its record and weighted score.
						</p>
					</>
				) : (
					<>
						<div>
							<p className="flex items-center gap-2 text-sm font-semibold">
								{vendor.name}
								{vendor.verified && (
									<FontAwesomeIcon
										icon={faCircleCheck}
										className="size-4 text-primary"
										aria-label="Verified vendor"
									/>
								)}
							</p>
							<p className="mt-0.5 text-sm text-muted-foreground">
								Rank #{vendor.rank} · {vendor.score} match
							</p>
						</div>
						<VendorRecord vendor={vendor} />
						<div className="border-t border-border pt-3">
							<p className="text-sm font-medium">Weighted score</p>
							<div className="mt-2">
								<VendorCriteria vendor={vendor} />
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
