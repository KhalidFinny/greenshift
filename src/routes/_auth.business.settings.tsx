import { CompanySettingsPage } from "@greenshift/business";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/business/settings")({
	component: CompanySettingsPage,
});
