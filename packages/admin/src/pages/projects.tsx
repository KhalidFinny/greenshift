import type { AdminProject } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ContentSkeleton,
	EmptyState,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import {
	faArrowTrendUp,
	faBuilding,
	faClipboardCheck,
	faGaugeHigh,
} from "@fortawesome/free-solid-svg-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
	BLUEPRINT_STATUS_BADGE,
	BLUEPRINT_STATUS_LABELS,
	PROJECT_STATUS_BADGE,
	PROJECT_STATUS_LABELS,
	PROJECT_STATUS_OPTIONS,
} from "../lib/project-status";
import type { ExportSection } from "../lib/export";
import { ExportMenu } from "../organisms/export-menu";
import { MetricCard } from "../organisms/metric-card";
import { ProjectDetailDialog } from "../organisms/project-detail-dialog";

const DEMO_PROJECTS: AdminProject[] = [
	{ id: 1, title: "Retrofit Chiller Pabrik Tekstil", status: "funding", companyName: "PT Hijau Nusantara", industrySector: "Manufaktur", budget: 500_000_000, riskScore: 72, blueprintStatus: "published" },
	{ id: 2, title: "Motor Efisiensi Tinggi", status: "funding", companyName: "PT Karbon Bersih", industrySector: "Industri Berat", budget: 350_000_000, riskScore: 68, blueprintStatus: "validated" },
	{ id: 3, title: "Sistem Pencahayaan LED", status: "monitoring", companyName: "PT Hijau Nusantara", industrySector: "Gedung", budget: 150_000_000, riskScore: 85, blueprintStatus: "published" },
	{ id: 4, title: "Panel Surya Atap Gudang", status: "draft", companyName: "PT Karbon Bersih", industrySector: "Logistik", budget: 800_000_000, riskScore: 55, blueprintStatus: null },
	{ id: 5, title: "Kompresor VFD", status: "assessment", companyName: "PT Hijau Nusantara", industrySector: "Manufaktur", budget: 200_000_000, riskScore: 62, blueprintStatus: null },
	{ id: 6, title: "Heat Recovery System", status: "completed", companyName: "PT Karbon Bersih", industrySector: "Industri Berat", budget: 450_000_000, riskScore: 78, blueprintStatus: "published" },
	{ id: 7, title: "Variable Speed Drive", status: "completed", companyName: "PT Hijau Nusantara", industrySector: "Manufaktur", budget: 280_000_000, riskScore: 71, blueprintStatus: "published" },
	{ id: 8, title: "Insulasi Pipa Industri", status: "completed", companyName: "PT Karbon Bersih", industrySector: "Industri Berat", budget: 120_000_000, riskScore: 88, blueprintStatus: "published" },
];

const idr = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

export function AdminProjects() {
	const [status, setStatus] = useState<string>("all");
	const [selected, setSelected] = useState<AdminProject | null>(null);
	const queryClient = useQueryClient();

	const projectsQuery = useQuery({
		queryKey: ["admin", "projects", status],
		queryFn: () => api.admin.projects(status === "all" ? { limit: 200 } : { status, limit: 200 }),
	});
	const statsQuery = useQuery({
		queryKey: ["admin", "stats"],
		queryFn: () => api.admin.stats(),
	});

	// Keep the sheet's project in sync with fresh list data (status changes,
	// filter moves the row out of view) and reflect mutation responses.
	const freshSelected = projectsQuery.data?.projects.find(
		(p) => p.id === selected?.id,
	);
	if (selected && freshSelected && freshSelected !== selected) {
		setSelected(freshSelected);
	}

	const handleMutated = (patch: Partial<AdminProject>) => {
		setSelected((prev) => (prev ? { ...prev, ...patch } : prev));
		queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
		queryClient.invalidateQueries({ queryKey: ["admin", "blueprints"] });
		queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
		queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
	};

	if (projectsQuery.isPending || statsQuery.isPending) {
		return <ContentSkeleton />;
	}

	if (projectsQuery.isError || statsQuery.isError) {
		return (
			<div className="space-y-4">
				<EmptyState
					title="Gagal memuat proyek"
					description="Tidak dapat mengambil data lifecycle proyek."
				/>
			</div>
		);
	}

	const stats = statsQuery.data;
	const projects = projectsQuery.data.projects.length > 0 ? projectsQuery.data.projects : DEMO_PROJECTS;
	const activeProjects = (stats.projects.funding ?? 0) + (stats.projects.monitoring ?? 0);
	const totalProjects = Object.values(stats.projects).reduce((a, b) => a + b, 0);
	const completedProjects = stats.projects.completed ?? 0;
	const avgRisk = projects.length > 0
		? Math.round(projects.reduce((sum, p) => sum + (p.riskScore ?? 0), 0) / projects.length)
		: 0;

	const projectExportSections: ExportSection[] = [
		{
			title: "Daftar Proyek",
			headers: [
				"Proyek",
				"Perusahaan",
				"Sektor",
				"Status",
				"Anggaran",
				"Risk",
				"Blueprint",
			],
			rows: projects.map((project) => [
				project.title,
				project.companyName,
				project.industrySector ?? "—",
				PROJECT_STATUS_LABELS[project.status] ?? project.status,
				project.budget ? idr.format(project.budget) : "—",
				String(project.riskScore ?? "—"),
				project.blueprintStatus
					? (BLUEPRINT_STATUS_LABELS[project.blueprintStatus] ??
						project.blueprintStatus)
					: "—",
			]),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Projects</h1>
					<p className="mt-1 text-base text-muted-foreground">
						Manajemen lifecycle proyek.
					</p>
				</div>
				<ExportMenu
					filename="projects"
					title="Projects"
					sections={projectExportSections}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					{ label: "Total Proyek", value: String(totalProjects), icon: faBuilding, sub: "seluruh pipeline" },
					{ label: "Proyek Aktif", value: String(activeProjects), icon: faArrowTrendUp, sub: "funding + monitoring" },
					{ label: "Selesai", value: String(completedProjects), icon: faClipboardCheck, sub: "proyek closed-loop" },
					{ label: "Avg Risk", value: String(avgRisk), icon: faGaugeHigh, sub: "rata-rata risk score" },
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
					<div className="flex items-center justify-between gap-4">
						<CardTitle className="text-xl">Daftar Proyek</CardTitle>
						<Select value={status} onValueChange={(value) => setStatus(value)}>
							<SelectTrigger className="w-[220px]">
								<SelectValue placeholder="Semua status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua status</SelectItem>
								{PROJECT_STATUS_OPTIONS.map((option) => (
									<SelectItem key={option} value={option}>
										{PROJECT_STATUS_LABELS[option]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent>
					{projects.length === 0 ? (
						<p className="text-base text-muted-foreground">Tidak ada proyek pada filter ini.</p>
					) : (
						<Table className="text-base">
							<TableHeader>
								<TableRow>
									<TableHead>Proyek</TableHead>
									<TableHead>Sektor</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Anggaran</TableHead>
									<TableHead>Risk</TableHead>
									<TableHead>Blueprint</TableHead>
									<TableHead>Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{projects.map((project) => {
									const riskColor =
										(project.riskScore ?? 0) >= 70
											? "text-primary"
											: (project.riskScore ?? 0) >= 50
												? "text-muted-foreground"
												: "text-destructive";
									return (
										<TableRow key={project.id}>
											<TableCell>
												<p className="font-medium">{project.title}</p>
												<p className="text-muted-foreground">{project.companyName}</p>
											</TableCell>
											<TableCell>{project.industrySector ?? "—"}</TableCell>
											<TableCell>
												<Badge variant={PROJECT_STATUS_BADGE[project.status] ?? "outline"} className="text-base px-3 !h-8 rounded-md">
													{PROJECT_STATUS_LABELS[project.status] ?? project.status}
												</Badge>
											</TableCell>
											<TableCell className="tabular-nums">
												{project.budget ? idr.format(project.budget) : "—"}
											</TableCell>
											<TableCell className={`tabular-nums ${riskColor}`}>{project.riskScore ?? "—"}</TableCell>
											<TableCell>
												{project.blueprintStatus ? (
													<Badge
														variant={BLUEPRINT_STATUS_BADGE[project.blueprintStatus] ?? "outline"}
														className="text-base px-3 !h-8 rounded-md"
													>
														{BLUEPRINT_STATUS_LABELS[project.blueprintStatus] ?? project.blueprintStatus}
													</Badge>
												) : (
													"—"
												)}
											</TableCell>
											<TableCell>
												<Button
													variant="outline"
													onClick={() => setSelected(project)}
												>
													Detail
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<ProjectDetailDialog
				project={selected}
				onOpenChange={(open) => {
					if (!open) setSelected(null);
				}}
				onMutated={handleMutated}
			/>
		</div>
	);
}
