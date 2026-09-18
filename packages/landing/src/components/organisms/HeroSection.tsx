import { buttonVariants, cn } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useParallax } from "../../hooks/useParallax";
import FloatingPill from "../atoms/FloatingPill";
import DashboardShowcase from "../molecules/DashboardShowcase";

// The hero is a viewport-filling stage whose layers are absolutely
// positioned, so it cannot reflow: it is laid out on a fixed 2400x1200
// design canvas (see `--u` in styles.css) and every content size below is a
// multiple of that canvas pixel from `lg` up, while positions stay in
// percentages. Sizes are the u = 1 values; the small-screen layout keeps
// the original responsive classes.
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
					<FloatingPill animation="float">Project Risk Assessment</FloatingPill>
				</li>
				<li className="absolute right-[8%] top-[48%]">
					<FloatingPill animation="float-delayed">
						Smart Vendor Matching
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
				className={cn(
					"pointer-events-none relative z-10 flex h-full flex-col items-center px-6 pt-24 text-center transition-all duration-700 motion-reduce:transition-none lg:px-[calc(var(--u)*24)] lg:pt-[max(96px,calc(var(--u)*96))]",
					titleIn ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
				)}
			>
				<h1
					className="text-[clamp(2.5rem,6vw,4.0625rem)] font-bold leading-[1.05] text-white lg:text-[length:calc(var(--u)*65)]"
					style={{
						fontFamily: "'IBM Plex Sans Variable', sans-serif",
						textShadow: "0 4px 40px rgba(0,0,0,0.8)",
					}}
				>
					Validate. Prepare. Fund. Monitor.
				</h1>

				<p
					className="mt-6 max-w-[1200px] font-medium text-lg leading-snug text-white/90 md:text-[24px] lg:mt-[calc(var(--u)*24)] lg:max-w-[calc(var(--u)*1200)] lg:text-[length:calc(var(--u)*24)]"
					style={{
						fontFamily: "'DM Sans Variable', sans-serif",
						textShadow: "0 4px 40px rgba(0,0,0,0.8)",
					}}
				>
					<img
						src="/logo-white.webp"
						alt="GreenShift"
						className="mr-3 inline-block h-[42px] align-middle lg:mr-[calc(var(--u)*12)] lg:h-[calc(var(--u)*42)]"
					/>
					helps industrial companies validate energy efficiency projects, build
					blueprints, and monitor ROI in one measurable and transparent
					ecosystem.
				</p>

				<nav
					className="pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-[46px] lg:mt-[calc(var(--u)*40)] lg:gap-[calc(var(--u)*46)]"
					aria-label="Hero actions"
				>
					<Link
						to="/register"
						className={cn(
							buttonVariants({ variant: "default" }),
							"h-[42px] w-[180px] cursor-pointer rounded-[10px] bg-[#f7f7f9] text-base text-[#1a1a1a] normal-case tracking-normal hover:bg-white lg:h-[calc(var(--u)*42)] lg:w-[calc(var(--u)*180)] lg:rounded-[calc(var(--u)*10)] lg:text-[length:calc(var(--u)*16)]",
						)}
					>
						Get Started Free
					</Link>
					<a
						href="mailto:contact@greenshift.com?subject=Project%20%26%20Investment"
						className={cn(
							buttonVariants({ variant: "outline" }),
							"h-[42px] w-[180px] cursor-pointer rounded-[10px] border-[3px] border-white bg-transparent text-base text-white normal-case tracking-normal hover:bg-white hover:text-[#1a1a1a] lg:h-[calc(var(--u)*42)] lg:w-[calc(var(--u)*180)] lg:rounded-[calc(var(--u)*10)] lg:border-[length:calc(var(--u)*3)] lg:text-[length:calc(var(--u)*16)]",
						)}
					>
						Contact Us
					</a>
				</nav>
			</div>

			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[15%] bg-gradient-to-b from-transparent via-white/50 to-white motion-reduce:from-transparent motion-reduce:to-white" />
		</section>
	);
}
