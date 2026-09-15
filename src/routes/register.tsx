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
	const { register } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [companyName, setCompanyName] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError(null);

		if (!name || !email || !companyName || !password) {
			setError("Semua kolom wajib diisi");
			setSubmitting(false);
			return;
		}
		if (password.length < 8) {
			setError("Kata sandi minimal 8 karakter");
			setSubmitting(false);
			return;
		}

		try {
			await register(name, email, password, companyName);
			// SPA transition: register() invalidates the router and the
			// register route's beforeLoad redirects to the role home with the
			// fresh session: no full page load, so toasts stay visible.
		} catch (err) {
			setError(
				err instanceof ApiError ? err.message : "Terjadi kesalahan, coba lagi",
			);
			setSubmitting(false);
		}
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
					<h1 className="text-3xl font-semibold">Daftar ke GreenShift</h1>
					<p className="mt-2 text-muted-foreground">
						Buat akun perusahaan untuk memulai proyek efisiensi energi Anda.
					</p>
					<form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
						<div className="space-y-2">
							<Label htmlFor="name">Nama</Label>
							<Input
								id="name"
								type="text"
								required
								autoComplete="name"
								value={name}
								onChange={(event) => setName(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								required
								autoComplete="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="companyName">Nama perusahaan</Label>
							<Input
								id="companyName"
								type="text"
								required
								autoComplete="organization"
								value={companyName}
								onChange={(event) => setCompanyName(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Kata sandi</Label>
							<Input
								id="password"
								type="password"
								required
								autoComplete="new-password"
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
								"Daftar"
							)}
						</Button>
					</form>
					<p className="mt-6 text-center text-sm text-muted-foreground">
						Sudah punya akun?{" "}
						<Link
							to="/login"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Masuk
						</Link>
					</p>
				</div>
			</section>
		</div>
	);
}
