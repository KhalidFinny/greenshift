import { AdminProjects } from "@greenshift/admin";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/admin/projects")({
	component: AdminProjects,
});
