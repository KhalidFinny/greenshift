import { useAuth } from "@greenshift/core";
import { Link } from "@tanstack/react-router";
import { useIsHome } from "../../hooks/useIsHome";

export default function Footer() {
	const { user } = useAuth();
	const isHome = useIsHome();
	const year = new Date().getFullYear();

	// Role pages have no footer; the public landing keeps it even when logged
	// in (same exception as the header).
	if (user && !isHome) return null;

	return (
		<footer className="bg-[#03442C] text-white">
			<div className="page-wrap grid gap-12 py-16 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
				<div>
					<img
						src="/logo-white.webp"
						alt="GreenShift"
						className="h-12 w-auto"
					/>
					<p className="mt-4 max-w-xs text-base leading-relaxed text-white/80">
						Platform MRV untuk pembiayaan hijau: memvalidasi proyek efisiensi
						energi, menyusun blueprint, dan memantau ROI dalam satu ekosistem.
					</p>
				</div>

				<nav aria-label="Navigasi produk">
					<h3 className="text-base font-semibold text-white">Produk</h3>
					<ul className="mt-4 flex flex-col gap-3">
						<li>
							<a href="#cara-kerja" className="text-white/80 hover:text-white">
								Cara Kerja
							</a>
						</li>
						<li>
							<a href="#ekosistem" className="text-white/80 hover:text-white">
								Ekosistem
							</a>
						</li>
						<li>
							<a href="#faq" className="text-white/80 hover:text-white">
								FAQ
							</a>
						</li>
					</ul>
				</nav>

				<nav aria-label="Navigasi akun">
					<h3 className="text-base font-semibold text-white">Akun</h3>
					<ul className="mt-4 flex flex-col gap-3">
						<li>
							<Link to="/register" className="text-white/80 hover:text-white">
								Mulai Gratis
							</Link>
						</li>
						<li>
							<Link to="/login" className="text-white/80 hover:text-white">
								Login
							</Link>
						</li>
					</ul>
				</nav>

				<div>
					<h3 className="text-base font-semibold text-white">Kontak</h3>
					<ul className="mt-4 flex flex-col gap-3">
						<li>
							<a
								href="mailto:contact@greenshift.com"
								className="text-white/80 underline underline-offset-2 hover:text-white"
							>
								contact@greenshift.com
							</a>
						</li>
						<li className="text-white/80">Diskusi proyek & investasi</li>
					</ul>
				</div>
			</div>

			<div className="border-t border-white/15">
				<div className="page-wrap flex flex-col items-center justify-between gap-2 py-6 text-base text-white/80 sm:flex-row">
					<small>&copy; {year} GreenShift. All rights reserved.</small>
					<span>Platform MRV untuk Pembiayaan Hijau</span>
				</div>
			</div>
		</footer>
	);
}
