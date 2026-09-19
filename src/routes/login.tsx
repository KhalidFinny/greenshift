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
import { Eye, EyeOff, FileText, Leaf, LineChart, Shield } from "lucide-react";
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

const features = [
	{ icon: Leaf, label: "Project\nManagement" },
	{ icon: Shield, label: "Risk\nAssessment" },
	{ icon: LineChart, label: "ROI\nTracking" },
	{ icon: FileText, label: "Transparent\nReporting" },
] as const;

function LoginPage() {
	const { login } = useAuth();
	const [showPassword, setShowPassword] = useState(false);

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
		<div className="relative min-h-screen overflow-hidden bg-[#F8FAF8] text-[#123D38]">
			{/* ── Background decorations ──────────────────────────── */}
			<div className="pointer-events-none absolute -left-32 -top-40 h-[420px] w-[650px] rounded-[45%] bg-[#E6F0EC]" />
			<div className="pointer-events-none absolute -bottom-48 -left-32 h-[300px] w-[620px] rounded-[50%] bg-[#E5F0EB]" />

			{/* ── Building image (bottom-right) ─────────────────── */}
			<div className="pointer-events-none absolute bottom-0 right-0 h-[65vh] w-[24vw] overflow-hidden max-lg:hidden">
				<img
					src="/skysidebar.webp"
					alt=""
					aria-hidden="true"
					className="h-full w-full object-cover"
				/>
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#F8FAF8] via-[#F8FAF8]/40 to-transparent" />
			</div>

			{/* ── Main layout ────────────────────────────────────── */}
			<main className="relative z-10 mx-auto min-h-screen max-w-[1600px] px-12 py-10">
				{/* Header */}
				<header className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button
							variant="outline"
							size="sm"
							asChild
							className="cursor-pointer rounded-lg border-[#82928B] bg-white text-sm font-semibold text-[#123D38] hover:border-[#07815F] hover:bg-[#E6F0EC]"
						>
							<Link to="/">Back</Link>
						</Button>
						<Link to="/" className="no-underline">
							<img
								src="/logo-long.svg"
								alt="GreenShift"
								className="h-8 w-auto"
							/>
						</Link>
					</div>
					<span className="text-right text-sm font-medium tracking-tight text-[#5A6B66]">
						Sustainable Finance
						<br />
						for a Greener Future.
					</span>
				</header>

				{/* Content grid */}
				<section className="grid min-h-[calc(100vh-120px)] grid-cols-[1fr_1.05fr] items-center gap-20 max-lg:grid-cols-1 max-lg:gap-12">
					{/* Left: brand message */}
					<div className="max-lg:order-2">
						<h1 className="max-w-[620px] text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#123D38] xl:text-6xl">
							Build a more
							<br />
							sustainable economy
						</h1>

						{/* Feature blocks */}
						<div className="mt-14 grid max-w-[680px] grid-cols-4 gap-8">
							{features.map((f) => (
								<div key={f.label} className="space-y-3">
									<f.icon className="h-6 w-6 text-[#07815F]" />
									<div>
										<p className="text-sm font-medium leading-5 text-[#174A43]">
											{f.label.split("\n").map((line, i) => (
												<span key={line}>
													{i > 0 && <br />}
													{line}
												</span>
											))}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Right: login card */}
					<div className="relative z-20 mx-auto w-full max-w-[620px] justify-self-end rounded-2xl border border-[#E5EBE8] bg-white p-10 shadow-[0_20px_60px_rgba(18,61,55,0.08)] max-lg:mx-0 max-lg:justify-self-center xl:p-12">
						<h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#123D38]">
							Sign in to GreenShift
						</h2>

						<form
							onSubmit={(event) => {
								event.preventDefault();
								void form.handleSubmit();
							}}
							className="mt-9 space-y-6"
							noValidate
						>
							{/* Email / username */}
							<form.AppField
								name="identifier"
								validators={{
									onChange: ({ value }) =>
										value.trim() ? undefined : "Email or username is required",
								}}
							>
								{(field) => {
									const error = field.state.meta.errors[0];
									const errorId = "identifier-error";
									return (
										<div className="space-y-2">
											<label
												htmlFor="identifier"
												className="mb-2 block text-sm font-medium text-[#244D47]"
											>
												Email or username
											</label>
											<input
												id="identifier"
												type="text"
												autoComplete="username"
												placeholder="you@company.com"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={error ? true : undefined}
												aria-describedby={error ? errorId : undefined}
												className="h-14 w-full rounded-xl border border-[#82928B] bg-[#FBFCFB] px-4 text-[#123D38] outline-none transition placeholder:text-[#667570] focus:border-[#07815F] focus:ring-2 focus:ring-[#07815F]/10"
											/>
											{error ? (
												<p
													id={errorId}
													role="alert"
													className="text-sm text-red-700"
												>
													{String(error)}
												</p>
											) : null}
										</div>
									);
								}}
							</form.AppField>

							{/* Password */}
							<form.AppField
								name="password"
								validators={{
									onChange: ({ value }) =>
										value ? undefined : "Password is required",
								}}
							>
								{(field) => {
									const error = field.state.meta.errors[0];
									const errorId = "password-error";
									return (
										<div className="space-y-2">
											<label
												htmlFor="password"
												className="mb-2 block text-sm font-medium text-[#244D47]"
											>
												Password
											</label>
											<div className="relative">
												<input
													id="password"
													type={showPassword ? "text" : "password"}
													autoComplete="current-password"
													placeholder="Enter your password"
													value={field.state.value ?? ""}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={error ? true : undefined}
													aria-describedby={error ? errorId : undefined}
													className="h-14 w-full rounded-xl border border-[#82928B] bg-[#FBFCFB] px-4 pr-11 text-[#123D38] outline-none transition placeholder:text-[#667570] focus:border-[#07815F] focus:ring-2 focus:ring-[#07815F]/10"
												/>
												<button
													type="button"
													tabIndex={-1}
													onClick={() => setShowPassword((s) => !s)}
													className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667570] transition hover:text-[#123D38]"
													aria-label={
														showPassword ? "Hide password" : "Show password"
													}
												>
													{showPassword ? (
														<EyeOff className="h-5 w-5" />
													) : (
														<Eye className="h-5 w-5" />
													)}
												</button>
											</div>
											{error ? (
												<p
													id={errorId}
													role="alert"
													className="text-sm text-red-700"
												>
													{String(error)}
												</p>
											) : null}
										</div>
									);
								}}
							</form.AppField>

							<Button
								type="submit"
								size="lg"
								className="mt-2 w-full cursor-pointer rounded-xl bg-[#07815F] font-semibold text-white transition hover:bg-[#066E53] active:scale-[0.99]"
							>
								Sign in
							</Button>
						</form>

						{import.meta.env.DEV && devRole && devUsername && (
							<div className="mt-6 rounded-lg border border-dashed border-[#82928B] p-4">
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
						)}

						<p className="mt-7 text-center text-sm text-[#5A6B66]">
							Don't have an account?{" "}
							<Link
								to="/register"
								className="ml-1 font-semibold text-[#07815F] hover:underline"
							>
								Register
							</Link>
						</p>
					</div>
				</section>
			</main>

			{/* ── Copyright ────────────────────────────────────────── */}
			<p className="absolute bottom-8 left-12 z-10 text-sm text-[#5A6B66]">
				© 2026 GreenShift
			</p>
		</div>
	);
}
