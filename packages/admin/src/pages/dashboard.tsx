import { api } from "@greenshift/core";
import { Button, ContentSkeleton } from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import {
	ACTIVITY_DATA,
	BLUEPRINT_META,
	DEMO_BLUEPRINTS,
	DEMO_PROJECTS,
	DEMO_STATS,
	DEMO_USERS,
	PENDING_ACTIONS,
	SYSTEM_COMPONENTS,
	SYSTEM_SUCCESS_RATE,
	SYSTEM_UPTIME,
} from "../lib/demo-data";
import type { ExportSection } from "../lib/export";
import { formatDateTime } from "../lib/format";
import { BottomRow } from "../organisms/bottom-row";
import { ChartsRow } from "../organisms/charts-row";
import { ExportMenu } from "../organisms/export-menu";
import { KanbanRow } from "../organisms/kanban-row";
import { KpiRow } from "../organisms/kpi-row";
import { AccountsTable, BlueprintsTable } from "../organisms/tables";

export function AdminDashboard() {
	const stats = useQuery({
		queryKey: ["admin", "stats"],
		queryFn: () => api.admin.stats(),
	});
	const usersQuery = useQuery({
		queryKey: ["admin", "users", "latest"],
		queryFn: () => api.admin.users({ limit: 50 }),
	});
	const blueprintsQuery = useQuery({
		queryKey: ["admin", "blueprints", "latest"],
		queryFn: () => api.admin.blueprints({ limit: 50 }),
	});
	const projectsQuery = useQuery({
		queryKey: ["admin", "projects", "kanban"],
		queryFn: () => api.admin.projects({ limit: 50 }),
	});

	if (
		stats.isPending ||
		usersQuery.isPending ||
		blueprintsQuery.isPending ||
		projectsQuery.isPending
	) {
		return <ContentSkeleton />;
	}

	if (
		stats.isError ||
		usersQuery.isError ||
		blueprintsQuery.isError ||
		projectsQuery.isError
	) {
		return (
			<div className="space-y-4">
				<p className="text-muted-foreground">Gagal memuat dashboard.</p>
				<Button
					variant="outline"
					onClick={() => {
						stats.refetch();
						usersQuery.refetch();
						blueprintsQuery.refetch();
					}}
				>
					Coba lagi
				</Button>
			</div>
		);
	}

	const raw = stats.data;
	const hasData = Object.values(raw.users).reduce((a, b) => a + b, 0) > 0;
	const data = hasData ? raw : DEMO_STATS;
	const users =
		usersQuery.data.users.length > 0 ? usersQuery.data.users : DEMO_USERS;
	const blueprints =
		blueprintsQuery.data.blueprints.length > 0
			? blueprintsQuery.data.blueprints
			: DEMO_BLUEPRINTS;
	const projects =
		projectsQuery.data.projects.length > 0
			? projectsQuery.data.projects
			: DEMO_PROJECTS;

	const activeProjects =
		(data.projects.funding ?? 0) + (data.projects.monitoring ?? 0);
	const totalProjects = Object.values(data.projects).reduce((a, b) => a + b, 0);
	const co2Reduction = 49.77;

	const sections: ExportSection[] = [
		{
			title: "Akun Terbaru",
			headers: [
				"Pengguna",
				"Email",
				"Peran",
				"Perusahaan",
				"Profil Vendor",
				"Verifikasi",
				"Terdaftar",
			],
			rows: users
				.slice(0, 5)
				.map((user) => [
					user.name,
					user.email,
					user.role,
					user.companyName ?? "-",
					user.vendorProfile ? "✓" : "-",
					user.verifiedAt !== null ? "Terverifikasi" : "Belum",
					formatDateTime(user.createdAt),
				]),
		},
		{
			title: "Blueprint Terbaru",
			headers: ["Proyek", "Status", "Validasi", "Catatan"],
			rows: blueprints
				.slice(0, 5)
				.map((bp) => [
					bp.projectTitle,
					BLUEPRINT_META[bp.status]?.label ?? bp.status,
					formatDateTime(bp.validatedAt),
					bp.auditNote ?? "-",
				]),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Dashboard</h1>
					<p className="mt-1 text-base text-muted-foreground">
						Ringkasan platform pembiayaan hijau.
					</p>
				</div>
				<ExportMenu
					filename="dashboard"
					title="Dashboard"
					sections={sections}
				/>
			</div>

			<KpiRow
				companies={data.companies}
				activeProjects={activeProjects}
				totalProjects={totalProjects}
				projectValue={data.investments.sum}
				totalBonds={data.investments.total}
				co2Reduction={co2Reduction}
			/>

			<ChartsRow activityData={ACTIVITY_DATA} carbonReduction={co2Reduction} />

			<KanbanRow projects={projects} />

			<BottomRow
				pendingActions={PENDING_ACTIONS}
				successRate={SYSTEM_SUCCESS_RATE}
				uptime={SYSTEM_UPTIME}
				components={SYSTEM_COMPONENTS}
			/>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<AccountsTable users={users} />
				<BlueprintsTable blueprints={blueprints} />
			</div>
		</div>
	);
}
