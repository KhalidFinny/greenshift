import { api } from "@greenshift/core";
import { Button, EmptyState } from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import type { ExportSection } from "../lib/export";
import { formatDateTime, formatMonth } from "../lib/format";
import { BLUEPRINT_META } from "../lib/labels";
import { ExportMenu } from "../molecules/export-menu";
import { KpiRow } from "../molecules/kpi-row";
import { ChartsRow } from "../organisms/charts-row";
import { KanbanRow } from "../organisms/kanban-row";
import { PendingActionsCard } from "../organisms/pending-actions";
import { PlatformStatusCard } from "../organisms/platform-status";
import { AccountsTable, BlueprintsTable } from "../organisms/tables";

export function AdminDashboard() {
	const statsQuery = useQuery({
		queryKey: ["admin", "stats"],
		queryFn: () => api.admin.stats(),
	});
	const analyticsQuery = useQuery({
		queryKey: ["admin", "analytics"],
		queryFn: () => api.admin.analytics(),
	});
	const anomaliesQuery = useQuery({
		queryKey: ["admin", "anomalies"],
		queryFn: () => api.admin.anomalies(),
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
	// The probe is optional: without it the status card reports unknown rather than taking the whole console down.
	const healthQuery = useQuery({
		queryKey: ["admin", "health"],
		queryFn: () => api.system.health(),
		retry: false,
	});

	if (
		statsQuery.isError ||
		analyticsQuery.isError ||
		anomaliesQuery.isError ||
		usersQuery.isError ||
		blueprintsQuery.isError ||
		projectsQuery.isError
	) {
		return (
			<EmptyState
				tone="error"
				title="Dashboard data did not load"
				description="The console could not reach the admin endpoints behind platform stats, analytics, anomalies, accounts, or blueprints."
				action={
					<Button
						variant="outline"
						onClick={() => {
							void Promise.all([
								statsQuery.refetch(),
								analyticsQuery.refetch(),
								anomaliesQuery.refetch(),
								usersQuery.refetch(),
								blueprintsQuery.refetch(),
								projectsQuery.refetch(),
							]);
						}}
					>
						Try again
					</Button>
				}
			/>
		);
	}

	// Cached data survives a refetch, so each card shimmers its own values instead of the whole console blanking out.
	const loading =
		statsQuery.isPending ||
		analyticsQuery.isPending ||
		anomaliesQuery.isPending ||
		usersQuery.isPending ||
		blueprintsQuery.isPending ||
		projectsQuery.isPending;

	const stats = statsQuery.data;
	const analytics = analyticsQuery.data;
	const users = usersQuery.data?.users ?? [];
	const blueprints = blueprintsQuery.data?.blueprints ?? [];
	const projects = projectsQuery.data?.projects ?? [];

	const activeProjects = stats
		? (stats.projects.funding ?? 0) + (stats.projects.monitoring ?? 0)
		: 0;
	const totalProjects = stats
		? Object.values(stats.projects).reduce((a, b) => a + b, 0)
		: 0;
	const activityData = (analytics?.monthly ?? []).map((point) => ({
		label: formatMonth(point.month),
		value: point.projects,
	}));

	const sections: ExportSection[] = [
		{
			title: "Latest Accounts",
			headers: [
				"User",
				"Email",
				"Role",
				"Company",
				"Vendor Profile",
				"Verification",
				"Registered",
			],
			rows: users
				.slice(0, 5)
				.map((user) => [
					user.name,
					user.email,
					user.role,
					user.companyName ?? "-",
					user.vendorProfile ? "Yes" : "No",
					user.verifiedAt !== null ? "Verified" : "Not verified",
					formatDateTime(user.createdAt),
				]),
		},
		{
			title: "Latest Blueprints",
			headers: ["Project", "Status", "Validation", "Note"],
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
			<div className="flex flex-wrap items-center justify-end gap-4">
				{loading ? null : (
					<ExportMenu
						filename="dashboard"
						title="Dashboard"
						sections={sections}
					/>
				)}
			</div>

			<KpiRow
				loading={loading}
				companies={stats?.companies ?? 0}
				activeProjects={activeProjects}
				totalProjects={totalProjects}
				projectValue={stats?.investments.sum ?? 0}
				totalBonds={stats?.investments.total ?? 0}
				co2Reduction={analytics?.totals.carbonReduction ?? 0}
				co2Target={analytics?.totals.carbonReductionTarget ?? 0}
			/>

			<ChartsRow
				loading={loading}
				activityData={activityData}
				carbonReduction={analytics?.totals.carbonReduction ?? 0}
				carbonTarget={analytics?.totals.carbonReductionTarget ?? 0}
			/>

			<KanbanRow loading={loading} projects={projects} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<PendingActionsCard
					loading={anomaliesQuery.isPending}
					actions={anomaliesQuery.data?.flags ?? []}
				/>
				<PlatformStatusCard
					loading={healthQuery.isPending}
					health={healthQuery.data}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<AccountsTable loading={usersQuery.isPending} users={users} />
				<BlueprintsTable
					loading={blueprintsQuery.isPending}
					blueprints={blueprints}
				/>
			</div>
		</div>
	);
}
