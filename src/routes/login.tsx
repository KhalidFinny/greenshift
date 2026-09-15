import {
	ApiError,
	getDevRole,
	getDevScope,
	roleHome,
	useAuth,
} from "@greenshift/core";
import { Button, Input, Label, Spinner } from "@greenshift/ui";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import type { FormEvent } from "react";
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
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const devRole = getDevRole();
	const devUsername = devRole
		? devRole === "admin"
			? "admin"
			: `${devRole}1`
		: null;

	async function loginWith(identifierValue: string, passwordValue: string) {
		setSubmitting(true);
		setError(null);
		try {
			const user = await login(resolveEmail(identifierValue), passwordValue);
			const devRole = getDevRole();
			if (devRole && user.role !== devRole) {
				setError(`Akun ${user.role} tidak tersedia pada server dev:${devRole}`);
				return;
			}
			// No full page load: useAuth.login() invalidates the router, the
			// login route's beforeLoad re-runs with the fresh session and
			// redirects to the role home: so toasts (and UI state) survive
			// the transition uninterrupted.
		} catch (err) {
			setError(
				err instanceof ApiError ? err.message : "Terjadi kesalahan, coba lagi",
			);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await loginWith(identifier, password);
	}

	async function handleDevLogin() {
		if (!import.meta.env.DEV || !devUsername) return;
		setIdentifier(devUsername);
		setPassword(DEV_PASSWORD);
		await loginWith(devUsername, DEV_PASSWORD);
	}

	return (
		<div className="grid min-h-screen lg:grid-cols-2">
			<section className="hidden flex-col justify-between bg-[#03442C] p-12 lg:flex">
				<Link to="/" className="no-underline">
					<img src="/logo-white.webp" alt="GreenShift" className="h-12" />
				</Link>
				<div className="max-w-md">
					<h2 className="text-4xl font-semibold leading-tight text-white">
						Platform MRV untuk Pembiayaan Hijau
					</h2>
					<p className="mt-4 text-base leading-relaxed text-white/70">
						Kelola proyek, tender, dan laporan MRV dalam satu platform.
						Transparan untuk bisnis, vendor, dan pengawas.
					</p>
				</div>
				<p className="text-sm text-white/50">© 2026 GreenShift</p>
			</section>

			<section className="flex items-center justify-center px-6 py-12">
				<div className="w-full max-w-md">
					<Link
						to="/"
						className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
					>
						<HugeiconsIcon icon={ArrowLeft02Icon} />
						Kembali
					</Link>
					<h1 className="text-3xl font-semibold">Masuk ke GreenShift</h1>
					<p className="mt-2 text-muted-foreground">
						Akses dashboard sesuai peran Anda.
					</p>
					<form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
						<div className="space-y-2">
							<Label htmlFor="identifier">Email atau username</Label>
							<Input
								id="identifier"
								type="text"
								required
								autoComplete="username"
								value={identifier}
								onChange={(event) => setIdentifier(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								required
								autoComplete="current-password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
						</div>
						{error && (
							<p
								role="alert"
								className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
							>
								{error}
							</p>
						)}
						<Button
							type="submit"
							disabled={submitting}
							className="w-full cursor-pointer"
						>
							{submitting ? (
								<span className="inline-flex items-center gap-2">
									<Spinner className="size-4" />
									Memproses…
								</span>
							) : (
								"Masuk"
							)}
						</Button>
					</form>
					{import.meta.env.DEV && devRole && devUsername && (
						<div className="mt-6 rounded-lg border border-dashed border-border p-4">
							<p className="text-sm font-medium">Dev mode: {devRole}</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Login otomatis dengan akun dev role ini.
							</p>
							<Button
								variant="outline"
								disabled={submitting}
								onClick={handleDevLogin}
								className="mt-3 w-full cursor-pointer"
							>
								Masuk sebagai {devUsername}
							</Button>
						</div>
					)}
					<p className="mt-6 text-center text-sm text-muted-foreground">
						Belum punya akun?{" "}
						<Link
							to="/register"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Daftar
						</Link>
					</p>
				</div>
			</section>
		</div>
	);
}
