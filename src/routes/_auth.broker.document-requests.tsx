import { BrokerDocumentRequestsPage } from "@greenshift/broker";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/broker/document-requests")({
	component: BrokerDocumentRequestsPage,
});
