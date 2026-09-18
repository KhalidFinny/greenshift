import { useAuth } from "@greenshift/core";
import { EmptyState } from "@greenshift/ui";

export function BusinessDashboard() {
	const { user } = useAuth();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Business Dashboard</h1>
				<p className="mt-1 text-muted-foreground">
					Welcome, {user?.name ?? "user"}.
				</p>
			</div>
			<EmptyState description="Run the package to run this" />
		</div>
	);
}
