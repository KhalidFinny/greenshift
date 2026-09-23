import {
	faCheckCircle,
	faHandshake,
	faStar,
	faWarehouse,
} from "@fortawesome/free-solid-svg-icons";
import type { AdminVendor } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Badge,
	Bar,
	BarChart,
	BarXAxis,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ChartTooltip,
	DataTable,
	EmptyState,
	Grid,
	ShimmerBlock,
} from "@greenshift/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import type { ExportSection } from "../lib/export";
import { useStepUpAction } from "../lib/use-step-up-action";
import { ExportMenu } from "../organisms/export-menu";
import { MetricCard } from "../organisms/metric-card";
import { StepUpDialog } from "../organisms/step-up-dialog";
import { TableSkeleton } from "../organisms/table-skeleton";
import {
	missingVendorPackItems,
	VendorDetailDialog,
} from "../organisms/vendor-detail-dialog";
import { VendorPerformanceDialog } from "../organisms/vendor-performance-dialog";

/** Column labels for the loading frame, in table order. */
const VENDOR_HEADERS = [
	"Vendor",
	"Certifications",
	"Portfolio",
	"Rating",
	"Verification",
	"Actions",
];

const vendorColumns = (
	onVerify: (vendor: AdminVendor, verified: boolean) => void,
	isPending: boolean,
): ColumnDef<AdminVendor>[] => [
	{
		id: "vendor",
		accessorFn: (vendor) => vendor.companyName,
		header: "Vendor",
		cell: ({ row }) => (
			<>
				<p className="font-medium">{row.original.companyName}</p>
				<p className="text-muted-foreground">{row.original.email}</p>
			</>
		),
	},
	{
		id: "certifications",
		accessorFn: (vendor) => vendor.certifications.join(", "),
		header: "Certifications",
		cell: ({ row }) =>
			row.original.certifications.length > 0 ? (
				<div className="flex flex-wrap gap-1">
					{row.original.certifications.map((cert) => (
						<Badge
							key={cert}
							variant="secondary"
							className="text-base px-3 !h-8 rounded-md"
						>
							{cert}
						</Badge>
					))}
				</div>
			) : (
				<span className="text-muted-foreground">-</span>
			),
	},
	{
		id: "portfolio",
		accessorFn: (vendor) => vendor.portfolio.length,
		header: "Portfolio",
		cell: ({ row }) =>
			row.original.portfolio.length > 0 ? (
				<span>{row.original.portfolio.length} projects</span>
			) : (
				<span className="text-muted-foreground">-</span>
			),
	},
	{
		id: "rating",
		accessorFn: (vendor) => vendor.rating,
		header: "Rating",
		cell: ({ row }) => (
			<span className="tabular-nums">{row.original.rating.toFixed(1)}</span>
		),
	},
	{
		id: "verification",
		accessorFn: (vendor) =>
			vendor.verifiedAt !== null ? "Verified" : "Not verified",
		header: "Verification",
		cell: ({ row }) => {
			const verified = row.original.verifiedAt !== null;
			return (
				<Badge
					variant={verified ? "default" : "destructive"}
					className="text-base px-3 !h-8 rounded-md"
				>
					{verified ? "Verified" : "Not verified"}
				</Badge>
			);
		},
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => {
			const verified = row.original.verifiedAt !== null;
			const missing = missingVendorPackItems(row.original);
			return (
				<Button
					variant={verified ? "outline" : "default"}
					onClick={() => onVerify(row.original, !verified)}
					disabled={isPending || (!verified && missing.length > 0)}
					title={
						!verified && missing.length > 0
							? `Still to file: ${missing.join(", ")}`
							: undefined
					}
				>
					{verified ? "Revoke verification" : "Verify"}
				</Button>
			);
		},
	},
];

export function AdminVendors() {
	const queryClient = useQueryClient();
	const [verifyError, setVerifyError] = useState<string | null>(null);
	const [perfOpen, setPerfOpen] = useState(false);
	const [detailVendor, setDetailVendor] = useState<AdminVendor | null>(null);

	const vendorsQuery = useQuery({
		queryKey: ["admin", "vendors"],
		queryFn: () => api.admin.vendors({ limit: 100 }),
	});

	const verify = useStepUpAction(
		({ id, verified }: { id: number; verified: boolean }) =>
			api.admin.verifyVendor(id, verified),
		() => {
			queryClient.invalidateQueries({ queryKey: ["admin", "vendors"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
		},
	);

	const handleVerify = (vendor: AdminVendor, verified: boolean) => {
		setVerifyError(null);
		void verify
			.run({ id: vendor.id, verified })
			.catch((err: unknown) =>
				setVerifyError(
					err instanceof Error ? err.message : "Verification failed",
				),
			);
	};

	if (vendorsQuery.isError) {
		return (
			<EmptyState
				tone="error"
				title="Vendors did not load"
				description="GET /api/admin/vendors did not answer, so the vendor roster and its matchmaking figures could not be read."
				action={
					<Button variant="outline" onClick={() => vendorsQuery.refetch()}>
						Try again
					</Button>
				}
			/>
		);
	}

	// Cached vendors survive a refetch, so each part shimmers only its own values.
	const loading = vendorsQuery.isPending;
	const vendors = vendorsQuery.data?.vendors ?? [];
	const totalVendors = vendors.length;
	const verifiedCount = vendors.filter((v) => v.verifiedAt !== null).length;
	// No vendors yet means no rating to average; anything else would be invented.
	const averageRating =
		totalVendors > 0
			? vendors.reduce((sum, v) => sum + v.rating, 0) / totalVendors
			: 0;
	const totalProjects = vendors.reduce((sum, v) => sum + v.totalProjects, 0);
	const topVendors = [...vendors]
		.sort((a, b) => b.rating - a.rating)
		.slice(0, 5);
	const performanceChartData = topVendors.map((vendor) => ({
		label: vendor.companyName,
		value: vendor.rating,
	}));

	const vendorExportSections: ExportSection[] = [
		{
			title: "Vendor Verification",
			headers: [
				"Vendor",
				"Email",
				"Certifications",
				"Portfolio",
				"Rating",
				"Verification",
			],
			rows: vendors.map((vendor) => [
				vendor.companyName,
				vendor.email,
				vendor.certifications.join(", ") || "-",
				vendor.portfolio.length > 0
					? `${vendor.portfolio.length} projects`
					: "-",
				vendor.rating.toFixed(1),
				vendor.verifiedAt !== null ? "Verified" : "Not verified",
			]),
		},
	];

	const columns = vendorColumns(handleVerify, verify.isPending);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-end gap-4">
				{loading ? null : (
					<ExportMenu
						filename="vendors"
						title="Vendors"
						sections={vendorExportSections}
					/>
				)}
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					{
						label: "Total Vendors",
						value: String(totalVendors),
						icon: faWarehouse,
						sub: "registered vendors",
					},
					{
						label: "Verified",
						value: String(verifiedCount),
						icon: faCheckCircle,
						sub: "vendors passed curation",
					},
					{
						label: "Average Rating",
						value: averageRating.toFixed(1),
						icon: faStar,
						sub: "vendor performance",
					},
					{
						label: "Total Projects",
						value: String(totalProjects),
						icon: faHandshake,
						sub: "handled by vendors",
					},
				].map((card) => (
					<MetricCard
						key={card.label}
						label={card.label}
						value={card.value}
						sub={card.sub}
						icon={card.icon}
						loading={loading}
					/>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-xl">Vendor Performance</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
					<div className="space-y-4">
						{loading ? (
							<ShimmerBlock className="aspect-[16/8] w-full" />
						) : (
							<BarChart
								data={performanceChartData}
								xDataKey="label"
								aspectRatio="16 / 8"
							>
								<Grid
									horizontal
									highlightRowValues={[4.5]}
									highlightRowStroke="var(--chart-5)"
								/>
								<Bar dataKey="value" fill="var(--chart-3)" lineCap="round" />
								<BarXAxis />
								<ChartTooltip />
							</BarChart>
						)}
						<div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-base text-muted-foreground">
								Target benchmark: 4.5 / 5
							</p>
							{vendors.length > 5 ? (
								<Button variant="outline" onClick={() => setPerfOpen(true)}>
									View All ({vendors.length})
								</Button>
							) : null}
						</div>
					</div>

					<div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
						<div className="space-y-1">
							<p className="text-base text-muted-foreground">Top performers</p>
							<p className="text-xl font-semibold">Highest-rated vendors</p>
						</div>
						<ol className="divide-y divide-border">
							{loading
								? Array.from({ length: 5 }, (_, index) => (
										<li key={index} className="flex items-center gap-3 py-3">
											<ShimmerBlock className="h-5 w-6 shrink-0" />
											<div className="min-w-0 flex-1 space-y-2">
												<ShimmerBlock className="h-5 w-40" />
												<ShimmerBlock className="h-4 w-24" />
											</div>
											<ShimmerBlock className="h-6 w-10 shrink-0" />
											<ShimmerBlock className="h-9 w-20 shrink-0" />
										</li>
									))
								: topVendors.map((vendor, index) => (
										<li
											key={vendor.id}
											className="flex items-center gap-3 py-3"
										>
											<span className="w-6 shrink-0 text-base font-semibold tabular-nums text-muted-foreground">
												{index + 1}
											</span>
											<div className="min-w-0 flex-1">
												<p className="truncate text-base font-medium">
													{vendor.companyName}
												</p>
												<p className="text-base text-muted-foreground">
													{vendor.totalProjects} projects
												</p>
											</div>
											<span className="shrink-0 text-xl font-semibold tabular-nums">
												{vendor.rating.toFixed(1)}
											</span>
											<Button
												variant="outline"
												onClick={() => setDetailVendor(vendor)}
											>
												Detail
											</Button>
										</li>
									))}
						</ol>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Vendor Verification</CardTitle>
				</CardHeader>
				<CardContent>
					{verifyError && (
						<p className="mb-4 text-base text-destructive">{verifyError}</p>
					)}
					{loading ? (
						<TableSkeleton headers={VENDOR_HEADERS} search rows={5} />
					) : vendors.length === 0 ? (
						<EmptyState
							title="No vendors to verify"
							description="No vendor account has completed registration yet, so the curation queue is empty. Vendors appear here as soon as they sign up."
						/>
					) : (
						<DataTable
							columns={columns}
							data={vendors}
							getRowId={(vendor) => String(vendor.id)}
							ariaLabel="Vendor verification"
							searchPlaceholder="Search vendors"
							emptyMessage="No vendors match your search."
						/>
					)}
				</CardContent>
			</Card>

			<StepUpDialog
				isOpen={verify.stepUpOpen}
				onClose={verify.closeStepUp}
				onSuccess={verify.retryAfterStepUp}
			/>

			<VendorPerformanceDialog
				open={perfOpen}
				onOpenChange={setPerfOpen}
				vendors={vendors}
				onViewDetails={setDetailVendor}
			/>

			<VendorDetailDialog
				vendor={detailVendor}
				onOpenChange={(open) => {
					if (!open) setDetailVendor(null);
				}}
			/>
		</div>
	);
}
