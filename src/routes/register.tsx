import {
	ApiError,
	getDevRole,
	getDevScope,
	roleHome,
	useAuth,
} from "@greenshift/core";
import { useAppForm } from "@greenshift/ui";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPage() {
	const { register } = useAuth();
	const [error, setError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: {
			name: "",
			email: "",
			companyName: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setError(null);
			try {
				await register(
					value.name,
					value.email,
					value.password,
					value.companyName,
				);
				// SPA transition: register() invalidates the router and the
				// register route's beforeLoad redirects to the role home with the
				// fresh session: no full page load, so toasts stay visible.
			} catch (err) {
				setError(
					err instanceof ApiError
						? err.message
						: "Something went wrong, please try again",
				);
			}
		},
	});

	return (
		<div className="grid min-h-screen lg:grid-cols-2">
			<section className="relative hidden flex-col justify-between overflow-hidden bg-[#014A2F] p-12 lg:flex">
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

			<section className="flex items-center justify-center px-6 py-12">
				<div className="w-full max-w-md">
					<Link
						to="/"
						className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
					>
						<HugeiconsIcon icon={ArrowLeft02Icon} />
						Go back
					</Link>
					<h1 className="text-3xl font-semibold">Register for GreenShift</h1>
					<p className="mt-2 text-muted-foreground">
						Create a company account to start your energy efficiency project.
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
							name="name"
							validators={{
								onChange: ({ value }) =>
									value ? undefined : "Name is required",
							}}
						>
							{(field) => <field.TextField label="Name" autoComplete="name" />}
						</form.AppField>
						<form.AppField
							name="email"
							validators={{
								onChange: ({ value }) => {
									if (!value) return "Email is required";
									return EMAIL_RE.test(value)
										? undefined
										: "Enter a valid email";
								},
							}}
						>
							{(field) => (
								<field.TextField
									label="Email"
									type="email"
									autoComplete="email"
								/>
							)}
						</form.AppField>
						<form.AppField
							name="companyName"
							validators={{
								onChange: ({ value }) =>
									value ? undefined : "Company name is required",
							}}
						>
							{(field) => (
								<field.TextField
									label="Company name"
									autoComplete="organization"
								/>
							)}
						</form.AppField>
						<form.AppField
							name="password"
							validators={{
								onChange: ({ value }) => {
									if (!value) return "Password is required";
									return value.length >= 8
										? undefined
										: "Password must be at least 8 characters";
								},
							}}
						>
							{(field) => (
								<field.PasswordField
									label="Password"
									autoComplete="new-password"
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
								Register
							</form.SubmitButton>
						</form.AppForm>
					</form>
					<p className="mt-6 text-center text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							to="/login"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Sign in
						</Link>
					</p>
				</div>
			</section>
		</div>
	);
}
