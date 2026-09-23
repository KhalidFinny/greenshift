import { MyProjects } from "@greenshift/business";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/business/projects/")({
	component: MyProjects,
});
