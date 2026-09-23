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
						An MRV platform for green financing: validating energy-efficiency
						projects, drafting blueprints, and monitoring ROI in a single
						ecosystem.
					</p>
				</div>

				<nav aria-label="Product navigation">
					<h3 className="text-base font-semibold text-white">Product</h3>
					<ul className="mt-4 flex flex-col gap-3">
						<li>
							<a
								href="#how-it-works"
								className="text-white/80 hover:text-white"
							>
								How It Works
							</a>
						</li>
						<li>
							<a href="#ecosystem" className="text-white/80 hover:text-white">
								Ecosystem
							</a>
						</li>
						<li>
							<a href="#faq" className="text-white/80 hover:text-white">
								FAQ
							</a>
						</li>
					</ul>
				</nav>

				<nav aria-label="Account navigation">
					<h3 className="text-base font-semibold text-white">Account</h3>
					<ul className="mt-4 flex flex-col gap-3">
						<li>
							<Link to="/register" className="text-white/80 hover:text-white">
								Start for Free
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
					<h3 className="text-base font-semibold text-white">Contact</h3>
					<ul className="mt-4 flex flex-col gap-3">
						<li>
							<a
								href="mailto:contact@greenshift.com"
								className="text-white/80 underline underline-offset-2 hover:text-white"
							>
								contact@greenshift.com
							</a>
						</li>
						<li className="text-white/80">
							Project &amp; investment discussion
						</li>
					</ul>
				</div>
			</div>

			<div className="border-t border-white/15">
				<div className="page-wrap flex flex-col items-center justify-between gap-2 py-6 text-base text-white/80 sm:flex-row">
					{/* A span, not `small`: the element's own 0.8em would put the line
					    under the 14px floor the rest of the interface holds. */}
					<span>&copy; {year} GreenShift. All rights reserved.</span>
					<span>An MRV Platform for Green Financing</span>
				</div>
			</div>
		</footer>
	);
}
