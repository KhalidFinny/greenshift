import { BondsPage } from "@greenshift/investor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/bonds/")({
	component: BondsPage,
});
