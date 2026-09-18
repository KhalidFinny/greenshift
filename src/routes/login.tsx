import {
	ApiError,
	getDevRole,
	getDevScope,
	roleHome,
	useAuth,
} from "@greenshift/core";
import { Button, useAppForm } from "@greenshift/ui";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { getSessionFn } from "../lib/session";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		if (getDevScope() === "landing") throw redirect({ to: "/" });
		const user = await getSessionFn();
		const devRole = getDevRole();
		if (user && (!devRole || user.role === devRole)) {
			throw redirect({ to: roleHome[user.role] });
		}
	},
	component: LoginPage,
});

function resolveEmail(input: string): string {
	const trimmed = input.trim();
	return trimmed.includes("@") ? trimmed : `${trimmed}@greenshift.dev`;
}

// Only ever defined in dev builds; constant-folded to "" in production so
// the credential never ships in the client bundle.
const DEV_PASSWORD = import.meta.env.DEV ? "12345678" : "";

function LoginPage() {
	const { login } = useAuth();
	const [error, setError] = useState<string | null>(null);

	const devRole = getDevRole();
	const devUsername = devRole
		? devRole === "admin"
			? "admin"
			: `${devRole}1`
		: null;

	async function loginWith(identifierValue: string, passwordValue: string) {
		setError(null);
		try {
			const user = await login(resolveEmail(identifierValue), passwordValue);
			const devRole = getDevRole();
			if (devRole && user.role !== devRole) {
				setError(
					`${user.role} account is not available on the dev server:${devRole}`,
				);
				return;
			}
			// No full page load: useAuth.login() invalidates the router, the
			// login route's beforeLoad re-runs with the fresh session and
			// redirects to the role home: so toasts (and UI state) survive
			// the transition uninterrupted.
		} catch (err) {
			setError(
				err instanceof ApiError
					? err.message
					: "Something went wrong, please try again",
			);
		}
	}

	const form = useAppForm({
		defaultValues: { identifier: "", password: "" },
		onSubmit: async ({ value }) => {
			await loginWith(value.identifier, value.password);
		},
	});

	async function handleDevLogin() {
		if (!import.meta.env.DEV || !devUsername) return;
		form.setFieldValue("identifier", devUsername);
		form.setFieldValue("password", DEV_PASSWORD);
		await loginWith(devUsername, DEV_PASSWORD);
	}

	return (
		<div className="grid min-h-screen lg:grid-cols-2">
			{/* ── Visual hero panel ────────────────────────────────── */}
			<section className="hidden flex-col justify-between overflow-hidden bg-[#014A2F] p-12 lg:flex">
				{/* Background landscape */}
				<img
					src="/green-1.webp"
					alt=""
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
				/>
				{/* Dark-to-green gradient overlay */}
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#014A2F]/90 via-[#014A2F]/60 to-[#03442C]/40" />
				{/* Subtle radial glow behind the dashboard */}
				<div className="pointer-events-none absolute left-1/2 top-[42%] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />

				{/* Dashboard preview — floating behind text */}
				<div className="pointer-events-none absolute inset-x-0 top-[26%] mx-auto w-[78%] max-w-[560px] rotate-[-2deg] opacity-60 blur-[1px]">
					<div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
						<img
							src="/dashboard.webp"
							alt=""
							aria-hidden="true"
							className="h-auto w-full"
						/>
					</div>
				</div>

				{/* Logo */}
				<Link to="/" className="relative z-10 no-underline">
					<img src="/logo-white.webp" alt="GreenShift" className="h-10" />
				</Link>

				{/* Text block */}
				<div className="relative z-10 max-w-md">
					<h2 className="text-4xl font-semibold leading-tight text-white">
						MRV Platform for Green Financing
					</h2>
					<p className="mt-4 text-base leading-relaxed text-white/70">
						Manage projects, tenders, and MRV reports in one platform.
						Transparent for businesses, vendors, and regulators.
					</p>
				</div>

				<p className="relative z-10 text-sm text-white/40">© 2026 GreenShift</p>
			</section>

			{/* ── Form panel ──────────────────────────────────────── */}
			<section className="flex items-center justify-center px-6 py-12">
				<div className="w-full max-w-md">
					<Link
						to="/"
						className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
					>
						<HugeiconsIcon icon={ArrowLeft02Icon} />
						Go back
					</Link>
					<h1 className="text-3xl font-semibold">Sign in to GreenShift</h1>
					<p className="mt-2 text-muted-foreground">
						Access the dashboard for your role.
					</p>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							void form.handleSubmit();
						}}
						className="mt-8 space-y-6"
						noValidate
					>
						<form.AppField
							name="identifier"
							validators={{
								onChange: ({ value }) =>
									value.trim() ? undefined : "Email or username is required",
							}}
						>
							{(field) => (
								<field.TextField
									label="Email or username"
									autoComplete="username"
								/>
							)}
						</form.AppField>
						<form.AppField
							name="password"
							validators={{
								onChange: ({ value }) =>
									value ? undefined : "Password is required",
							}}
						>
							{(field) => (
								<field.PasswordField
									label="Password"
									autoComplete="current-password"
								/>
							)}
						</form.AppField>
						{error && (
							<p
								role="alert"
								className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
							>
								{error}
							</p>
						)}
						<form.AppForm>
							<form.SubmitButton className="h-12 w-full cursor-pointer text-base font-semibold">
								Sign in
							</form.SubmitButton>
						</form.AppForm>
					</form>
					{import.meta.env.DEV && devRole && devUsername && (
						<div className="mt-6 rounded-lg border border-dashed border-border p-4">
							<p className="text-sm font-medium">Dev mode: {devRole}</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Automatically sign in with this dev role account.
							</p>
							<Button
								variant="outline"
								onClick={handleDevLogin}
								className="mt-3 w-full cursor-pointer"
							>
								Sign in as {devUsername}
							</Button>
						</div>
					)}
					<p className="mt-6 text-center text-sm text-muted-foreground">
						Don't have an account?{" "}
						<Link
							to="/register"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Register
						</Link>
					</p>
				</div>
			</section>
		</div>
	);
}
