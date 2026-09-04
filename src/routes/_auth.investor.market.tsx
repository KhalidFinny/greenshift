import { GreenMarket } from "@greenshift/investor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/investor/market")({
	component: GreenMarket,
});
