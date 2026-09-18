import type { AuditLogEntry } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Button,
	Card,
	ContentSkeleton,
	DataTable,
	EmptyState,
} from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { formatDateTime } from "../lib/format";
import { ExportMenu } from "../organisms/export-menu";

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
			<span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
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
					<pre className="mt-2 max-w-md overflow-x-auto rounded-sm bg-muted p-3 text-xs text-muted-foreground">
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

	if (logsQuery.isPending) {
		return <ContentSkeleton />;
	}

	if (logsQuery.isError) {
		return (
			<div className="space-y-4">
				<EmptyState
					title="Failed to load audit log"
					description="Unable to retrieve the activity trail."
				/>
				<div>
					<Button
						variant="outline"
						className="cursor-pointer"
						onClick={() => logsQuery.refetch()}
					>
						Try again
					</Button>
				</div>
			</div>
		);
	}

	const logs = logsQuery.data.logs;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Audit Log</h1>
					<p className="mt-1 text-base text-muted-foreground">
						Activity trail of all data passing through the platform.
					</p>
				</div>
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
			</div>

			{logs.length === 0 ? (
				<EmptyState
					title="No activity yet"
					description="The audit trail is empty so far."
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
