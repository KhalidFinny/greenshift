import { useAuth } from "@greenshift/core";
import { EmptyState } from "@greenshift/ui";

export function BusinessDashboard() {
	const { user } = useAuth();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Business Dashboard</h1>
				<p className="mt-1 text-base text-muted-foreground">
					Welcome, {user?.name ?? "user"}.
				</p>
			</div>
			<EmptyState
				title="Dashboard not built yet"
				description="This package has no dashboard screens yet: the business role signs in and lands here. Project submission, MRV reporting, and funding views are still to be built, so nothing is shown rather than invented."
			/>
		</div>
	);
}
