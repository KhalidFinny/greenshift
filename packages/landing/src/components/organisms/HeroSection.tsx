import { Button } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useInView } from "../../hooks/useInView";
import { useParallax } from "../../hooks/useParallax";
import FloatingPill from "../atoms/FloatingPill";
import DashboardShowcase from "../molecules/DashboardShowcase";

export default function HeroSection() {
	const yBg = useParallax(0.08);
	const yDashboard = useParallax(0.12, 60);
	const yFg = useParallax(0.15);
	const { ref, isVisible } = useInView<HTMLElement>({ threshold: 0 });

	return (
		<section
			id="hero"
			ref={ref}
			className="relative h-screen overflow-hidden bg-[#121212]"
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
					src="/green 2.png"
					alt=""
					className="h-[120%] w-[110%] object-cover"
				/>
			</div>

			<div
				className="pointer-events-none absolute bottom-0 left-0 right-0 z-2 flex justify-center px-8"
				style={{
					transform: `translateY(${yDashboard}px)`,
					willChange: "transform",
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
					src="/green 1.png"
					alt=""
					className="h-[50%] w-[110%] object-cover"
				/>
			</div>

			<ul className="pointer-events-none absolute inset-0 z-4 m-0 list-none p-0">
				<li className="absolute left-[8%] top-[42%]">
					<FloatingPill animation="float">Project Risk Assessment</FloatingPill>
				</li>
				<li className="absolute right-[8%] top-[48%]">
					<FloatingPill animation="float-delayed">
						Smart Vendor Match
					</FloatingPill>
				</li>
				<li className="absolute left-[8%] top-[58%]">
					<FloatingPill animation="float-slow">ROI Tracking</FloatingPill>
				</li>
				<li className="absolute right-[8%] top-[65%]">
					<FloatingPill animation="float-slow-delayed">
						Green Market
					</FloatingPill>
				</li>
			</ul>

			<div
				className={`pointer-events-none relative z-10 flex h-full flex-col items-center pt-[14vh] text-center transition-all duration-1000 ${
					isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
				}`}
			>
				<h1
					className="text-[65px] font-bold leading-[1.05] text-white"
					style={{
						fontFamily: "'IBM Plex Sans Variable', sans-serif",
						textShadow: "0 4px 40px rgba(0,0,0,0.8)",
					}}
				>
					Validate. Prepare. Fund. Monitor.
				</h1>

				<p
					className="mt-6 max-w-[1200px] font-medium text-[24px] leading-snug text-white/90"
					style={{
						fontFamily: "'DM Sans Variable', sans-serif",
						textShadow: "0 4px 40px rgba(0,0,0,0.8)",
					}}
				>
					<img
						src="/logo-white.png"
						alt="GreenShift"
						className="mr-3 inline-block h-[42px] align-middle"
					/>
					membantu perusahaan industri memvalidasi proyek efisiensi energi,
					menyusun blueprint dan memantau ROI dalam satu ekosistem yang terukur
					dan transparan.
				</p>

				<nav
					className="pointer-events-auto mt-10 flex gap-[46px]"
					aria-label="Hero actions"
				>
					<Button className="h-[42px] w-[180px] cursor-pointer rounded-[10px] bg-[#f7f7f9] text-[14px] text-[#1a1a1a] normal-case tracking-normal hover:bg-white">
						<Link to="/login" className="no-underline">
							Ajukan Proyek
						</Link>
					</Button>
					<Button
						variant="outline"
						className="h-[42px] w-[180px] cursor-pointer rounded-[10px] border-[3px] border-white bg-transparent text-[14px] text-white normal-case tracking-normal hover:bg-white hover:text-[#1a1a1a]"
					>
						<a href="#cara-kerja" className="no-underline">
							Lihat Cara Kerja
						</a>
					</Button>
				</nav>
			</div>

			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[15%] bg-gradient-to-b from-transparent via-white/50 to-white motion-reduce:from-transparent motion-reduce:to-white" />
		</section>
	);
}
