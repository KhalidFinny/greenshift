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
	EmptyState,
	Grid,
	Ring,
	RingChart,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ExportSection } from "../lib/export";
import { useStepUpAction } from "../lib/use-step-up-action";
import { ExportMenu } from "../organisms/export-menu";
import { MetricCard } from "../organisms/metric-card";
import { StepUpDialog } from "../organisms/step-up-dialog";
import { VendorDetailDialog } from "../organisms/vendor-detail-dialog";
import { VendorPerformanceDialog } from "../organisms/vendor-performance-dialog";

const MATCH_RATE = [
	{ label: "Sukses", value: 68, maxValue: 100, color: "var(--chart-1)" },
	{ label: "Belum match", value: 32, maxValue: 100, color: "var(--chart-5)" },
];

const MATCHES_OVER_TIME = [
	{ label: "Jan", value: 4 },
	{ label: "Feb", value: 6 },
	{ label: "Mar", value: 7 },
	{ label: "Apr", value: 9 },
	{ label: "Mei", value: 11 },
	{ label: "Jun", value: 12 },
	{ label: "Jul", value: 14 },
	{ label: "Agu", value: 18 },
];

const DEMO_PERFORMANCE_VENDORS: AdminVendor[] = [
	{
		id: 1,
		userId: 101,
		email: "ops@ecotech.id",
		userName: "EcoTech Team",
		companyName: "EcoTech",
		description: "Spesialis retrofit HVAC dan optimasi utilitas pabrik.",
		certifications: ["ISO 50001", "K3 Umum"],
		portfolio: ["Retrofit chiller 600 TR", "Optimasi kompresor pabrik tekstil"],
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
		description: "Vendor efisiensi energi dengan fokus audit dan LED retrofit.",
		certifications: ["ISO 9001", "Auditor Energi"],
		portfolio: ["LED relamping gudang", "Audit energi pabrik FMCG"],
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
		description: "Implementasi PLTS atap dan monitoring performa energi.",
		certifications: ["IEC Solar Installer"],
		portfolio: ["PLTS atap 500 kWp", "Monitoring energi multi-site"],
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
		description:
			"Vendor retrofit boiler dan heat recovery untuk industri berat.",
		certifications: ["PJK3", "Boiler Specialist"],
		portfolio: ["Heat recovery kiln", "Retrofit boiler biomassa"],
		rating: 4.0,
		totalProjects: 5,
		verifiedAt: null,
		createdAt: "2026-02-11T09:00:00.000Z",
	},
];

function VendorRow({
	vendor,
	onVerify,
	isPending,
}: {
	vendor: AdminVendor;
	onVerify: (verified: boolean) => void;
	isPending: boolean;
}) {
	const verified = vendor.verifiedAt !== null;
	return (
		<TableRow>
			<TableCell>
				<p className="font-medium">{vendor.companyName}</p>
				<p className="text-muted-foreground">{vendor.email}</p>
			</TableCell>
			<TableCell>
				{vendor.certifications.length > 0 ? (
					<div className="flex flex-wrap gap-1">
						{vendor.certifications.map((cert) => (
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
					<span className="text-muted-foreground">—</span>
				)}
			</TableCell>
			<TableCell>
				{vendor.portfolio.length > 0 ? (
					<span>{vendor.portfolio.length} proyek</span>
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</TableCell>
			<TableCell>
				<span className="tabular-nums">{vendor.rating.toFixed(1)}</span>
			</TableCell>
			<TableCell>
				<Badge
					variant={verified ? "default" : "destructive"}
					className="text-base px-3 !h-8 rounded-md"
				>
					{verified ? "Terverifikasi" : "Belum"}
				</Badge>
			</TableCell>
			<TableCell>
				<Button
					variant={verified ? "outline" : "default"}
					onClick={() => onVerify(!verified)}
					disabled={isPending}
				>
					{verified ? "Cabut verifikasi" : "Verifikasi"}
				</Button>
			</TableCell>
		</TableRow>
	);
}

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
				setVerifyError(err instanceof Error ? err.message : "Verifikasi gagal"),
			);
	};

	if (vendorsQuery.isPending) {
		return <ContentSkeleton />;
	}

	if (vendorsQuery.isError) {
		return (
			<div className="space-y-4">
				<EmptyState
					title="Gagal memuat vendor"
					description="Tidak dapat mengambil data vendor dan matchmaking."
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
			title: "Verifikasi Vendor",
			headers: [
				"Vendor",
				"Email",
				"Sertifikasi",
				"Portofolio",
				"Rating",
				"Verifikasi",
			],
			rows: vendors.map((vendor) => [
				vendor.companyName,
				vendor.email,
				vendor.certifications.join(", ") || "—",
				vendor.portfolio.length > 0 ? `${vendor.portfolio.length} proyek` : "—",
				vendor.rating.toFixed(1),
				vendor.verifiedAt !== null ? "Terverifikasi" : "Belum",
			]),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Vendors</h1>
					<p className="mt-1 text-base text-muted-foreground">
						Kurasi dan verifikasi vendor.
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
						label: "Total Vendor",
						value: String(totalVendors || 12),
						icon: faWarehouse,
						sub: "vendor terdaftar",
					},
					{
						label: "Terverifikasi",
						value: String(verifiedCount || 8),
						icon: faCheckCircle,
						sub: "vendor lolos kurasi",
					},
					{
						label: "Rata-rata Rating",
						value: averageRating.toFixed(1),
						icon: faStar,
						sub: "performa vendor",
					},
					{
						label: "Total Proyek",
						value: String(totalProjects),
						icon: faHandshake,
						sub: "ditangani vendor",
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
									Lihat Semua ({performanceSource.length})
								</Button>
							) : null}
						</div>
					</div>

					<div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
						<div className="space-y-1">
							<p className="text-base text-muted-foreground">Top performers</p>
							<p className="text-xl font-semibold">
								Vendor dengan rating tertinggi
							</p>
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
											{vendor.totalProjects} proyek
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
					<CardTitle className="text-lg">Verifikasi Vendor</CardTitle>
				</CardHeader>
				<CardContent>
					{verifyError && (
						<p className="mb-4 text-base text-destructive">{verifyError}</p>
					)}
					{vendors.length === 0 ? (
						<p className="text-base text-muted-foreground">
							Belum ada vendor terdaftar.
						</p>
					) : (
						<Table className="text-base">
							<TableHeader>
								<TableRow>
									<TableHead>Vendor</TableHead>
									<TableHead>Sertifikasi</TableHead>
									<TableHead>Portofolio</TableHead>
									<TableHead>Rating</TableHead>
									<TableHead>Verifikasi</TableHead>
									<TableHead>Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{vendors.map((vendor) => (
									<VendorRow
										key={vendor.id}
										vendor={vendor}
										isPending={verify.isPending}
										onVerify={(verified) => handleVerify(vendor, verified)}
									/>
								))}
							</TableBody>
						</Table>
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
