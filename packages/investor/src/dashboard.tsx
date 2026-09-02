import { useAuth } from "@greenshift/core";
import { Button, EmptyState } from "@greenshift/ui";
import { useRouter } from "@tanstack/react-router";

export function InvestorDashboard() {
	const { user } = useAuth();
	const router = useRouter();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Dashboard Investor</h1>
				<p className="mt-1 text-muted-foreground">
					Selamat datang, {user?.name ?? "pengguna"}.
				</p>
			</div>
			<EmptyState description="Run the package to run this" />
			<div>
				<Button
					variant="outline"
					onClick={() => router.navigate({ href: "/investor/404-test" })}
					className="cursor-pointer"
				>
					404
				</Button>
			</div>
		</div>
	);
}
