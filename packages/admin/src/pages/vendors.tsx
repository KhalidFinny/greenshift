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
	ContentSkeleton,
	DataTable,
	EmptyState,
	Grid,
	Ring,
	RingChart,
} from "@greenshift/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import type { ExportSection } from "../lib/export";
import { useStepUpAction } from "../lib/use-step-up-action";
import { ExportMenu } from "../organisms/export-menu";
import { MetricCard } from "../organisms/metric-card";
import { StepUpDialog } from "../organisms/step-up-dialog";
import { VendorDetailDialog } from "../organisms/vendor-detail-dialog";
import { VendorPerformanceDialog } from "../organisms/vendor-performance-dialog";

const MATCH_RATE = [
	{ label: "Successful", value: 68, maxValue: 100, color: "var(--chart-1)" },
	{ label: "Not matched", value: 32, maxValue: 100, color: "var(--chart-5)" },
];

const MATCHES_OVER_TIME = [
	{ label: "Jan", value: 4 },
	{ label: "Feb", value: 6 },
	{ label: "Mar", value: 7 },
	{ label: "Apr", value: 9 },
	{ label: "May", value: 11 },
	{ label: "Jun", value: 12 },
	{ label: "Jul", value: 14 },
	{ label: "Aug", value: 18 },
];

const DEMO_PERFORMANCE_VENDORS: AdminVendor[] = [
	{
		id: 1,
		userId: 101,
		email: "ops@ecotech.id",
		userName: "EcoTech Team",
		companyName: "EcoTech",
		description: "HVAC retrofit and factory utility optimization specialist.",
		certifications: ["ISO 50001", "General OHS"],
		portfolio: [
			"600 TR chiller retrofit",
			"Textile factory compressor optimization",
		],
		rating: 4.6,
		totalProjects: 7,
		verifiedAt: "2026-07-14T09:00:00.000Z",
		createdAt: "2026-05-03T09:00:00.000Z",
	},
	{
		id: 2,
		userId: 102,
		email: "growth@greenworks.id",
		userName: "GreenWorks Team",
		companyName: "GreenWorks",
		description:
			"Energy-efficiency vendor focused on audits and LED retrofits.",
		certifications: ["ISO 9001", "Energy Auditor"],
		portfolio: ["Warehouse LED relamping", "FMCG factory energy audit"],
		rating: 4.4,
		totalProjects: 6,
		verifiedAt: "2026-06-28T09:00:00.000Z",
		createdAt: "2026-04-21T09:00:00.000Z",
	},
	{
		id: 3,
		userId: 103,
		email: "project@solarx.id",
		userName: "SolarX Team",
		companyName: "SolarX",
		description:
			"Rooftop solar implementation and energy performance monitoring.",
		certifications: ["IEC Solar Installer"],
		portfolio: ["500 kWp rooftop solar", "Multi-site energy monitoring"],
		rating: 4.2,
		totalProjects: 5,
		verifiedAt: "2026-06-02T09:00:00.000Z",
		createdAt: "2026-03-17T09:00:00.000Z",
	},
	{
		id: 4,
		userId: 104,
		email: "team@carbonflow.id",
		userName: "CarbonFlow Team",
		companyName: "CarbonFlow",
		description: "Boiler retrofit and heat-recovery vendor for heavy industry.",
		certifications: ["PJK3", "Boiler Specialist"],
		portfolio: ["Heat recovery kiln", "Biomass boiler retrofit"],
		rating: 4.0,
		totalProjects: 5,
		verifiedAt: null,
		createdAt: "2026-02-11T09:00:00.000Z",
	},
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
			return (
				<Button
					variant={verified ? "outline" : "default"}
					onClick={() => onVerify(row.original, !verified)}
					disabled={isPending}
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

	if (vendorsQuery.isPending) {
		return <ContentSkeleton />;
	}

	if (vendorsQuery.isError) {
		return (
			<div className="space-y-4">
				<EmptyState
					title="Failed to load vendors"
					description="Unable to retrieve vendor and matchmaking data."
				/>
			</div>
		);
	}

	const vendors = vendorsQuery.data.vendors;
	const totalVendors = vendors.length;
	const verifiedCount = vendors.filter((v) => v.verifiedAt !== null).length;
	const averageRating =
		totalVendors > 0
			? vendors.reduce((sum, v) => sum + v.rating, 0) / totalVendors
			: 4.2;
	const totalProjects =
		totalVendors > 0
			? vendors.reduce((sum, v) => sum + v.totalProjects, 0)
			: 23;
	const performanceSource =
		vendors.length > 0 ? vendors : [...DEMO_PERFORMANCE_VENDORS];
	const topVendors = [...performanceSource]
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
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Vendors</h1>
					<p className="mt-1 text-base text-muted-foreground">
						Vendor curation and verification.
					</p>
				</div>
				<ExportMenu
					filename="vendors"
					title="Vendors"
					sections={vendorExportSections}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					{
						label: "Total Vendors",
						value: String(totalVendors || 12),
						icon: faWarehouse,
						sub: "registered vendors",
					},
					{
						label: "Verified",
						value: String(verifiedCount || 8),
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
					/>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-xl">Vendor Performance</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
					<div className="space-y-4">
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
						<div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-base text-muted-foreground">
								Target benchmark: 4.5 / 5
							</p>
							{performanceSource.length > 5 ? (
								<Button variant="outline" onClick={() => setPerfOpen(true)}>
									View All ({performanceSource.length})
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
							{topVendors.map((vendor, index) => (
								<li key={vendor.id} className="flex items-center gap-3 py-3">
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

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Match Success Rate</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center justify-center py-6">
						<div className="relative shrink-0">
							<RingChart data={MATCH_RATE} size={240} strokeWidth={18}>
								<Ring index={0} />
								<Ring index={1} />
							</RingChart>
							<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
								<p className="text-4xl font-semibold tabular-nums text-primary">
									68%
								</p>
								<p className="mt-1 text-base text-muted-foreground">
									match rate
								</p>
							</div>
						</div>
					</CardContent>
					<div className="mt-5 flex items-center justify-center gap-6">
						{MATCH_RATE.map((item) => (
							<div key={item.label} className="flex items-center gap-2">
								<span
									className="size-2.5 rounded-full"
									style={{ backgroundColor: item.color }}
									aria-hidden="true"
								/>
								<p className="text-base text-muted-foreground">{item.label}</p>
								<p className="text-base font-semibold tabular-nums">
									{item.value}%
								</p>
							</div>
						))}
					</div>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Matches Over Time</CardTitle>
					</CardHeader>
					<CardContent>
						<BarChart
							data={MATCHES_OVER_TIME}
							xDataKey="label"
							aspectRatio="16 / 9"
						>
							<Grid horizontal />
							<Bar dataKey="value" fill="var(--chart-1)" lineCap="round" />
							<BarXAxis />
							<ChartTooltip />
						</BarChart>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Vendor Verification</CardTitle>
				</CardHeader>
				<CardContent>
					{verifyError && (
						<p className="mb-4 text-base text-destructive">{verifyError}</p>
					)}
					{vendors.length === 0 ? (
						<p className="text-base text-muted-foreground">
							No registered vendors yet.
						</p>
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
				vendors={performanceSource}
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
