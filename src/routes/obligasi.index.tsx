import { ObligasiPage } from "@greenshift/investor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/obligasi/")({
	component: ObligasiPage,
});
