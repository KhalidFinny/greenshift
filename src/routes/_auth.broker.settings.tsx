import { BrokerSettingsPage } from "@greenshift/broker";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/broker/settings")({
	component: BrokerSettingsPage,
});
