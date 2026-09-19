import {
	ApiError,
	getDevRole,
	getDevScope,
	roleHome,
	useAuth,
} from "@greenshift/core";
import { useAppForm } from "@greenshift/ui";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
	AuthInput,
	AuthLayout,
	AuthPasswordInput,
	AuthSubmit,
} from "../components/auth-layout";
import { getSessionFn } from "../lib/session";

export const Route = createFileRoute("/register")({
	beforeLoad: async () => {
		if (getDevScope() === "landing") throw redirect({ to: "/" });
		const user = await getSessionFn();
		const devRole = getDevRole();
		if (user && (!devRole || user.role === devRole)) {
			throw redirect({ to: roleHome[user.role] as "/" });
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
		<AuthLayout
			title="Register for GreenShift"
			description="Create a company account to start your energy efficiency project."
			footer={
				<>
					Already have an account?{" "}
					<Link
						to="/login"
						className="ml-1 font-semibold text-[#07815F] hover:underline"
					>
						Sign in
					</Link>
				</>
			}
		>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void form.handleSubmit();
				}}
				className="space-y-6"
				noValidate
			>
				<form.AppField
					name="name"
					validators={{
						onChange: ({ value }) => (value ? undefined : "Name is required"),
					}}
				>
					{(field) => (
						<AuthInput
							id="name"
							label="Name"
							autoComplete="name"
							placeholder="Your full name"
							value={field.state.value ?? ""}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							error={field.state.meta.errors[0]}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="email"
					validators={{
						onChange: ({ value }) => {
							if (!value) return "Email is required";
							return EMAIL_RE.test(value) ? undefined : "Enter a valid email";
						},
					}}
				>
					{(field) => (
						<AuthInput
							id="email"
							label="Email"
							type="email"
							autoComplete="email"
							placeholder="you@company.com"
							value={field.state.value ?? ""}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							error={field.state.meta.errors[0]}
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
						<AuthInput
							id="companyName"
							label="Company name"
							autoComplete="organization"
							placeholder="PT Contoh Nusantara"
							value={field.state.value ?? ""}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							error={field.state.meta.errors[0]}
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
						<AuthPasswordInput
							id="password"
							label="Password"
							autoComplete="new-password"
							placeholder="At least 8 characters"
							value={field.state.value ?? ""}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							error={field.state.meta.errors[0]}
						/>
					)}
				</form.AppField>

				{error ? (
					<p
						role="alert"
						className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
					>
						{error}
					</p>
				) : null}

				<AuthSubmit>Create account</AuthSubmit>
			</form>
		</AuthLayout>
	);
}
