import type { AuditLogEntry } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import { Button, Card, DataTable, EmptyState } from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { formatDateTime } from "../lib/format";
import { ExportMenu } from "../organisms/export-menu";
import { TableSkeleton } from "../organisms/table-skeleton";

/** Column labels for the loading frame, in table order. */
const LOG_HEADERS = ["Time", "Action", "User", "Entity", "Detail"];

const logColumns: ColumnDef<AuditLogEntry>[] = [
	{
		id: "time",
		accessorFn: (log) => log.createdAt ?? "",
		header: "Time",
		cell: ({ row }) => formatDateTime(row.original.createdAt),
	},
	{
		id: "action",
		accessorFn: (log) => log.action,
		header: "Action",
		cell: ({ row }) => (
			<span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm font-medium">
				{row.original.action}
			</span>
		),
	},
	{
		id: "user",
		accessorFn: (log) => log.userEmail ?? "",
		header: "User",
		cell: ({ row }) => row.original.userEmail ?? "-",
	},
	{
		id: "entity",
		accessorFn: (log) =>
			log.entityType
				? `${log.entityType}${log.entityId !== null ? ` #${log.entityId}` : ""}`
				: "",
		header: "Entity",
		cell: ({ row }) =>
			row.original.entityType ? (
				<span className="text-muted-foreground">
					{row.original.entityType}
					{row.original.entityId !== null ? ` #${row.original.entityId}` : ""}
				</span>
			) : (
				"-"
			),
	},
	{
		id: "detail",
		accessorFn: (log) =>
			log.metadata === null || log.metadata === undefined
				? ""
				: JSON.stringify(log.metadata),
		header: "Detail",
		enableSorting: false,
		cell: ({ row }) => {
			const { metadata } = row.original;
			if (metadata === null || metadata === undefined) {
				return "-";
			}
			const json = JSON.stringify(metadata, null, 2);
			return (
				<details className="group">
					<summary className="cursor-pointer font-medium text-primary">
						View details
					</summary>
					<pre className="mt-2 max-w-md overflow-x-auto rounded-sm bg-muted p-3 text-sm text-muted-foreground">
						{json}
					</pre>
				</details>
			);
		},
	},
];

export function AdminAuditLogs() {
	const [limit, setLimit] = useState(100);

	const logsQuery = useQuery({
		queryKey: ["admin", "audit-logs", limit],
		queryFn: () => api.admin.auditLogs({ limit }),
	});

	const loading = logsQuery.isPending;
	const logs = logsQuery.data?.logs ?? [];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-end gap-4">
				{loading ? null : (
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							className="cursor-pointer"
							onClick={() => setLimit((current) => current + 100)}
						>
							Load more ({logs.length} loaded)
						</Button>
						<Button
							variant="outline"
							className="cursor-pointer"
							onClick={() => logsQuery.refetch()}
						>
							Refresh
						</Button>
						<ExportMenu
							filename="audit-log"
							title="Audit Log"
							sections={[
								{
									title: "Audit Log",
									headers: ["Time", "Action", "User", "Entity", "Detail"],
									rows: logs.map((log) => [
										formatDateTime(log.createdAt),
										log.action,
										log.userEmail ?? "-",
										log.entityType ? `${log.entityType} #${log.entityId}` : "-",
										log.metadata == null ? "-" : JSON.stringify(log.metadata),
									]),
								},
							]}
						/>
					</div>
				)}
			</div>

			{logsQuery.isError ? (
				<EmptyState
					tone="error"
					title="Audit trail did not load"
					description="GET /api/admin/audit-logs did not answer, so no activity entries could be retrieved."
					action={
						<Button
							variant="outline"
							className="cursor-pointer"
							onClick={() => logsQuery.refetch()}
						>
							Try again
						</Button>
					}
				/>
			) : loading ? (
				<Card className="overflow-hidden">
					<TableSkeleton headers={LOG_HEADERS} search rows={10} />
				</Card>
			) : logs.length === 0 ? (
				<EmptyState
					title="No recorded activity"
					description="Nothing has been written to the audit trail yet. Entries appear as soon as an admin changes a project status, a blueprint, or a vendor verification."
				/>
			) : (
				<Card className="overflow-hidden">
					<DataTable
						columns={logColumns}
						data={logs}
						getRowId={(log) => String(log.id)}
						ariaLabel="Audit log"
						searchPlaceholder="Search audit log"
						pageSize={10}
						emptyMessage="No audit entries match your search."
					/>
				</Card>
			)}
		</div>
	);
}
