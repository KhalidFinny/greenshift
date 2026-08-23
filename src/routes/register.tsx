import { getDevRole, getDevScope, roleHome } from "@greenshift/core";
import { EmptyState } from "@greenshift/ui";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { getSessionFn } from "../lib/session";

export const Route = createFileRoute("/register")({
	beforeLoad: async () => {
		if (getDevScope() === "landing") throw redirect({ to: "/" });
		const user = await getSessionFn();
		const devRole = getDevRole();
		if (user && (!devRole || user.role === devRole)) {
			throw redirect({ to: roleHome[user.role] });
		}
	},
	component: RegisterPage,
});

function RegisterPage() {
	return (
		<div className="flex min-h-screen items-center justify-center px-6 py-12">
			<div className="w-full max-w-md">
				<Link
					to="/"
					className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
				>
					<HugeiconsIcon icon={ArrowLeft02Icon} />
					Kembali
				</Link>
				<h1 className="text-3xl font-semibold">Daftar</h1>
				<p className="mt-2 text-muted-foreground">
					Buat akun baru untuk bergabung.
				</p>
				<div className="mt-8">
					<EmptyState description="Run the package to run this" />
				</div>
			</div>
		</div>
	);
}
