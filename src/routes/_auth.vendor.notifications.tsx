import { VendorNotificationsPage } from "@greenshift/vendor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/vendor/notifications")({
	component: VendorNotificationsPage,
});
