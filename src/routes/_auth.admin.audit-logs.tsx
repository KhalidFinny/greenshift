import { AdminAuditLogs } from "@greenshift/admin";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/admin/audit-logs")({
	component: AdminAuditLogs,
});
