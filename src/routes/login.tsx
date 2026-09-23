import {
	ApiError,
	getDevRole,
	getDevScope,
	publishToast,
	roleHome,
	useAuth,
} from "@greenshift/core";
import { Button, useAppForm } from "@greenshift/ui";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	AuthInput,
	AuthLayout,
	AuthPasswordInput,
	AuthSubmit,
} from "../components/auth-layout";
import { getSessionFn } from "../lib/session";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		if (getDevScope() === "landing") throw redirect({ to: "/" });
		const user = await getSessionFn();
		const devRole = getDevRole();
		if (user && (!devRole || user.role === devRole)) {
			throw redirect({ to: roleHome[user.role] as "/" });
		}
	},
	component: LoginPage,
});

function resolveEmail(input: string): string {
	const trimmed = input.trim();
	return trimmed.includes("@") ? trimmed : `${trimmed}@greenshift.dev`;
}

// Dev-only; constant-folded to "" in production so the credential never ships.
const DEV_PASSWORD = import.meta.env.DEV ? "12345678" : "";

function LoginPage() {
	const { login } = useAuth();

	const devRole = getDevRole();
	const devUsername = devRole ? `${devRole}1` : null;

	async function loginWith(identifierValue: string, passwordValue: string) {
		try {
			const user = await login(resolveEmail(identifierValue), passwordValue);
			const devRole = getDevRole();
			if (devRole && user.role !== devRole) {
				publishToast({
					tone: "error",
					message: `${user.role} account is not available on the dev server:${devRole}`,
				});
				return;
			}
		} catch (err) {
			publishToast({
				tone: "error",
				message:
					err instanceof ApiError
						? err.message
						: "Something went wrong, please try again",
			});
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
		<AuthLayout
			title="Sign in to GreenShift"
			footer={
				<>
					Don't have an account?{" "}
					<Link
						to="/register"
						className="ml-1 font-semibold text-[#07815F] hover:underline"
					>
						Register
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
					name="identifier"
					validators={{
						onChange: ({ value }) =>
							value.trim() ? undefined : "Email or username is required",
					}}
				>
					{(field) => (
						<AuthInput
							id="identifier"
							label="Email or username"
							type="text"
							autoComplete="username"
							placeholder="you@company.com"
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
						onChange: ({ value }) =>
							value ? undefined : "Password is required",
					}}
				>
					{(field) => (
						<AuthPasswordInput
							id="password"
							label="Password"
							autoComplete="current-password"
							placeholder="Enter your password"
							value={field.state.value ?? ""}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							error={field.state.meta.errors[0]}
						/>
					)}
				</form.AppField>

				<AuthSubmit>Sign in</AuthSubmit>
			</form>

			{import.meta.env.DEV && devRole && devUsername ? (
				<div className="rounded-lg border border-dashed border-[#82928B] p-4">
					<p className="text-sm font-medium">Dev mode: {devRole}</p>
					<p className="mt-1 text-sm text-[#5A6B66]">
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
			) : null}
		</AuthLayout>
	);
}
