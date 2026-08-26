import { buttonVariants, cn } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useParallax } from "../../hooks/useParallax";
import FloatingPill from "../atoms/FloatingPill";
import DashboardShowcase from "../molecules/DashboardShowcase";

// Background images render immediately on load; only the title (first) and
// the floating pills + dashboard (after) animate in.
export default function HeroSection() {
	const yBg = useParallax(0.08);
	const yDashboard = useParallax(0.12, 60);
	const yFg = useParallax(0.15);

	const [titleIn, setTitleIn] = useState(false);
	const [decorIn, setDecorIn] = useState(false);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setTitleIn(true);
			setDecorIn(true);
			return;
		}

		const raf = requestAnimationFrame(() => setTitleIn(true));
		const decorTimer = setTimeout(() => setDecorIn(true), 850);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(decorTimer);
		};
	}, []);

	return (
		<section
			id="hero"
			className="relative min-h-screen overflow-hidden bg-[#121212]"
		>
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					zIndex: 1,
					transform: `translateY(${yBg}px)`,
					willChange: "transform",
				}}
			>
				<img
					src="/green-2.webp"
					alt=""
					className="h-[120%] w-[110%] object-cover"
				/>
			</div>

			<div
				className="pointer-events-none absolute bottom-0 left-0 right-0 z-2 flex justify-center px-8 transition-opacity duration-1000 motion-reduce:transition-none"
				style={{
					transform: `translateY(${yDashboard}px)`,
					willChange: "transform",
					opacity: decorIn ? 1 : 0,
				}}
			>
				<DashboardShowcase />
			</div>

			<div
				className="pointer-events-none absolute inset-x-0 bottom-0 z-3"
				style={{
					transform: `translateY(${yFg}px)`,
					willChange: "transform",
				}}
			>
				<img
					src="/green-1.webp"
					alt=""
					className="h-[50%] w-[110%] object-cover"
				/>
			</div>

			<ul
				className={cn(
					"pointer-events-none absolute inset-0 z-4 m-0 hidden list-none p-0 transition-opacity duration-1000 motion-reduce:transition-none lg:block",
					decorIn ? "opacity-100" : "opacity-0",
				)}
			>
				<li className="absolute left-[8%] top-[42%]">
					<FloatingPill animation="float">Penilaian Risiko Proyek</FloatingPill>
				</li>
				<li className="absolute right-[8%] top-[48%]">
					<FloatingPill animation="float-delayed">
						Pencocokan Vendor Cerdas
					</FloatingPill>
				</li>
				<li className="absolute left-[8%] top-[58%]">
					<FloatingPill animation="float-slow">Pelacakan ROI</FloatingPill>
				</li>
				<li className="absolute right-[8%] top-[65%]">
					<FloatingPill animation="float-slow-delayed">
						Pasar Hijau
					</FloatingPill>
				</li>
			</ul>

			<div
				className={cn(
					"pointer-events-none relative z-10 flex h-full flex-col items-center px-6 pt-24 text-center transition-all duration-700 motion-reduce:transition-none",
					titleIn ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
				)}
			>
				<h1
					className="text-[clamp(2.5rem,6vw,4.0625rem)] font-bold leading-[1.05] text-white"
					style={{
						fontFamily: "'IBM Plex Sans Variable', sans-serif",
						textShadow: "0 4px 40px rgba(0,0,0,0.8)",
					}}
				>
					Validate. Prepare. Fund. Monitor.
				</h1>

				<p
					className="mt-6 max-w-[1200px] font-medium text-lg leading-snug text-white/90 md:text-[24px]"
					style={{
						fontFamily: "'DM Sans Variable', sans-serif",
						textShadow: "0 4px 40px rgba(0,0,0,0.8)",
					}}
				>
					<img
						src="/logo-white.webp"
						alt="GreenShift"
						className="mr-3 inline-block h-[42px] align-middle"
					/>
					membantu perusahaan industri memvalidasi proyek efisiensi energi,
					menyusun blueprint dan memantau ROI dalam satu ekosistem yang terukur
					dan transparan.
				</p>

				<nav
					className="pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-[46px]"
					aria-label="Hero actions"
				>
					<Link
						to="/register"
						className={cn(
							buttonVariants({ variant: "default" }),
							"h-[42px] w-[180px] cursor-pointer rounded-[10px] bg-[#f7f7f9] text-base text-[#1a1a1a] normal-case tracking-normal hover:bg-white",
						)}
					>
						Mulai Gratis
					</Link>
					<a
						href="mailto:contact@greenshift.com?subject=Proyek%20%26%20Investasi"
						className={cn(
							buttonVariants({ variant: "outline" }),
							"h-[42px] w-[180px] cursor-pointer rounded-[10px] border-[3px] border-white bg-transparent text-base text-white normal-case tracking-normal hover:bg-white hover:text-[#1a1a1a]",
						)}
					>
						Hubungi Kami
					</a>
				</nav>
			</div>

			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[15%] bg-gradient-to-b from-transparent via-white/50 to-white motion-reduce:from-transparent motion-reduce:to-white" />
		</section>
	);
}
