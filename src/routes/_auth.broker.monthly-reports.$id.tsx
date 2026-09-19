import { BrokerReportDetailPage } from "@greenshift/broker";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/broker/monthly-reports/$id")({
	component: BrokerReportDetailPage,
});
