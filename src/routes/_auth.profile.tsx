import { EmptyState } from "@greenshift/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<h1 className="text-2xl font-semibold">Profile</h1>
			<EmptyState description="Run the package to run this" />
		</div>
	);
}
