import type { AuditLogEntry } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import {
	Button,
	Card,
	ContentSkeleton,
	EmptyState,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatDateTime } from "../lib/format";
import { ExportMenu } from "../organisms/export-menu";

function MetadataCell({ log }: { log: AuditLogEntry }) {
	if (log.metadata === null || log.metadata === undefined) {
		return <TableCell>-</TableCell>;
	}
	const json = JSON.stringify(log.metadata, null, 2);
	return (
		<TableCell>
			<details className="group">
				<summary className="cursor-pointer font-medium text-primary">
					Lihat detail
				</summary>
				<pre className="mt-2 max-w-md overflow-x-auto rounded-sm bg-muted p-3 text-xs text-muted-foreground">
					{json}
				</pre>
			</details>
		</TableCell>
	);
}

function LogRow({ log }: { log: AuditLogEntry }) {
	return (
		<TableRow>
			<TableCell>{formatDateTime(log.createdAt)}</TableCell>
			<TableCell>
				<span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
					{log.action}
				</span>
			</TableCell>
			<TableCell>{log.userEmail ?? "-"}</TableCell>
			<TableCell>
				{log.entityType ? (
					<span className="text-muted-foreground">
						{log.entityType}
						{log.entityId !== null ? ` #${log.entityId}` : ""}
					</span>
				) : (
					"-"
				)}
			</TableCell>
			<MetadataCell log={log} />
		</TableRow>
	);
}

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
					title="Gagal memuat audit log"
					description="Tidak dapat mengambil jejak aktivitas."
				/>
				<div>
					<Button
						variant="outline"
						className="cursor-pointer"
						onClick={() => logsQuery.refetch()}
					>
						Coba lagi
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
						Jejak aktivitas seluruh data yang melewati platform.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						className="cursor-pointer"
						onClick={() => setLimit((current) => current + 100)}
					>
						Muat lebih ({logs.length} dimuat)
					</Button>
					<Button
						variant="outline"
						className="cursor-pointer"
						onClick={() => logsQuery.refetch()}
					>
						Muat ulang
					</Button>
					<ExportMenu
						filename="audit-log"
						title="Audit Log"
						sections={[
							{
								title: "Audit Log",
								headers: ["Waktu", "Aksi", "Pengguna", "Entitas", "Detail"],
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
					title="Belum ada aktivitas"
					description="Jejak audit kosong sejauh ini."
				/>
			) : (
				<Card className="overflow-hidden">
					<Table aria-label="Audit log" className="text-base">
						<TableHeader>
							<TableHead>Waktu</TableHead>
							<TableHead>Aksi</TableHead>
							<TableHead>Pengguna</TableHead>
							<TableHead>Entitas</TableHead>
							<TableHead>Detail</TableHead>
						</TableHeader>
						<TableBody>
							{logs.map((log) => (
								<LogRow key={log.id} log={log} />
							))}
						</TableBody>
					</Table>
				</Card>
			)}
		</div>
	);
}
