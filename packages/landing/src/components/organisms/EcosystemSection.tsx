import {
	Building2,
	Landmark,
	ShieldCheck,
	TrendingUp,
	Truck,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "../../hooks/useInView";

const actors = [
	{
		icon: Building2,
		label: "Company",
		tagline: "Submits projects and energy needs",
		detail:
			"Industrial companies submit energy efficiency projects to GreenShift along with supporting documents such as electricity bills, energy audits, and operational data. Our team validates every submission so the project is ready for the next stage.",
		angle: -90,
	},
	{
		icon: Truck,
		label: "Vendor",
		tagline: "Provides solutions and executes projects",
		detail:
			"Registered energy vendors provide technical solutions, conduct on-site assessments, and execute energy efficiency projects. Every vendor has gone through a verification process to ensure quality and reliability.",
		angle: -90 + 72,
	},
	{
		icon: ShieldCheck,
		label: "Independent Validator",
		tagline: "Validates data and impact objectively",
		detail:
			"Independent validators verify energy data, calculate carbon emission reduction impact, and prepare transparent audit reports. Ensuring every claim is based on factual, verifiable data.",
		angle: -90 + 72 * 2,
	},
	{
		icon: Landmark,
		label: "OJK-Licensed SCF Partners",
		tagline: "Provides access to public funding",
		detail:
			"OJK-licensed supply chain financing partners provide green funding instruments such as green bonds and sukuk. Connecting verified projects with trusted public funding sources.",
		angle: -90 + 72 * 3,
	},
	{
		icon: TrendingUp,
		label: "Investor",
		tagline: "Funds projects and receives returns",
		detail:
			"Individual and institutional investors fund energy efficiency projects through the GreenShift platform. Every investment is linked to a real project that generates ROI and measurable emission reduction impact.",
		angle: -90 + 72 * 4,
	},
];

const RADIUS = 210;
const DEGREES_PER_SEC = 72 / 6; // 6s per node, 30s per full cycle
const RESUME_DELAY = 8000;

function normalizeAngle(a: number) {
	return ((a % 360) + 360) % 360;
}

function detectCrossing(
	prevAngle: number,
	currAngle: number,
	current: number,
): number {
	const p = normalizeAngle(prevAngle);
	const c = normalizeAngle(currAngle);
	const moveAmount = (c - p + 360) % 360;

	for (let i = 0; i < actors.length; i++) {
		if (i === current) continue;
		const node = normalizeAngle(actors[i].angle);
		const distFromPrev = (node - p + 360) % 360;
		const distFromCurr = Math.abs(c - node);
		const circularDist = Math.min(distFromCurr, 360 - distFromCurr);
		if (distFromPrev > 0 && distFromPrev <= moveAmount && circularDist < 8) {
			return i;
		}
	}
	return current;
}

export default function EcosystemSection() {
	const [active, setActive] = useState(0);
	const [ballAngle, setBallAngle] = useState(actors[0].angle);
	const pausedRef = useRef(false);
	const lastTimeRef = useRef<number | null>(null);
	const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const prevBallAngleRef = useRef(actors[0].angle);
	const { ref, isVisible } = useInView<HTMLElement>({ threshold: 0.1 });
	const selected = actors[active];
	const Icon = selected.icon;

	// Orbital animation loop (static under prefers-reduced-motion)
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		let raf: number;

		const tick = (now: number) => {
			if (lastTimeRef.current === null) {
				lastTimeRef.current = now;
			}

			if (!pausedRef.current) {
				const dt = (now - lastTimeRef.current) / 1000;
				setBallAngle((prev) => prev + DEGREES_PER_SEC * dt);
			}

			lastTimeRef.current = now;
			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, []);

	// Detect when ball crosses a node
	useEffect(() => {
		const crossed = detectCrossing(prevBallAngleRef.current, ballAngle, active);
		if (crossed !== active) {
			setActive(crossed);
		}
		prevBallAngleRef.current = ballAngle;
	}, [ballAngle, active]);

	// Pause on user click, resume after delay
	const handleNodeClick = useCallback((i: number) => {
		setActive(i);
		setBallAngle(actors[i].angle);
		prevBallAngleRef.current = actors[i].angle;
		pausedRef.current = true;
		lastTimeRef.current = null;

		if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
		resumeTimerRef.current = setTimeout(() => {
			pausedRef.current = false;
			lastTimeRef.current = null;
			prevBallAngleRef.current = actors[i].angle;
		}, RESUME_DELAY);
	}, []);

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
		};
	}, []);

	// Ball position
	const rad = (ballAngle * Math.PI) / 180;
	const bx = Math.cos(rad) * RADIUS;
	const by = Math.sin(rad) * RADIUS;

	return (
		<section
			id="ecosystem"
			ref={ref}
			className="relative overflow-hidden bg-white"
		>
			<div className="page-wrap relative z-10 py-24">
				<header className="mb-16 max-w-2xl">
					<p className="text-sm font-bold uppercase tracking-[0.2em] text-[#03442C]">
						Ecosystem
					</p>
					<h2 className="mt-4 text-[36px] font-bold leading-tight text-[#1C1C1C]">
						Collaboration for the industrial energy transition
					</h2>
				</header>

				<div
					className={`grid grid-cols-1 items-center gap-16 transition-all duration-700 motion-reduce:transition-none lg:grid-cols-[1fr_1fr] ${
						isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
					}`}
				>
					{/* Left: Circular ecosystem */}
					<div className="hidden lg:flex lg:justify-center">
						<div
							className="relative"
							style={{
								width: `${RADIUS * 2 + 120}px`,
								height: `${RADIUS * 2 + 120}px`,
							}}
						>
							{/* Orbit ring */}
							<div
								className="absolute inset-0 m-auto rounded-full border border-[#03442C]/12"
								style={{ width: `${RADIUS * 2}px`, height: `${RADIUS * 2}px` }}
								aria-hidden="true"
							/>

							{/* SVG connecting lines + orbiting ball */}
							<svg
								className="absolute inset-0 h-full w-full"
								aria-hidden="true"
							>
								{actors.map((actor, i) => {
									const actorRad = (actor.angle * Math.PI) / 180;
									const cx = RADIUS + 60;
									const cy = RADIUS + 60;
									const nx = cx + Math.cos(actorRad) * RADIUS;
									const ny = cy + Math.sin(actorRad) * RADIUS;
									return (
										<line
											key={`line-${actor.label}`}
											x1={cx}
											y1={cy}
											x2={nx}
											y2={ny}
											stroke="#03442C"
											strokeOpacity={active === i ? "0.4" : "0.15"}
											strokeWidth={active === i ? "1.5" : "1"}
											strokeDasharray="4 4"
											className="transition-all duration-500 motion-reduce:transition-none"
										/>
									);
								})}
								{/* Orbiting ball */}
								<circle
									cx={RADIUS + 60 + bx}
									cy={RADIUS + 60 + by}
									r={6}
									fill="#00712D"
								/>
								<circle
									cx={RADIUS + 60 + bx}
									cy={RADIUS + 60 + by}
									r={10}
									fill="none"
									stroke="#00712D"
									strokeOpacity={0.3}
									strokeWidth={2}
								/>
							</svg>

							{/* Outer nodes */}
							{actors.map((actor, i) => {
								const actorRad = (actor.angle * Math.PI) / 180;
								const x = Math.cos(actorRad) * RADIUS;
								const y = Math.sin(actorRad) * RADIUS;
								const NodeIcon = actor.icon;
								const isActive = active === i;

								return (
									<button
										type="button"
										key={actor.label}
										onClick={() => handleNodeClick(i)}
										className="group absolute flex cursor-pointer flex-col items-center text-center transition-all duration-500 motion-reduce:transition-none"
										style={{
											left: `calc(50% + ${x}px - 60px)`,
											top: `calc(50% + ${y}px - 44px)`,
											width: "120px",
										}}
									>
										<div
											className={`flex h-[60px] w-[60px] items-center justify-center rounded-full border transition-all duration-500 motion-reduce:transition-none ${
												isActive
													? "border-[#03442C]/30 bg-[#03442C]"
													: "border-[#03442C]/15 bg-white opacity-60 group-hover:opacity-90"
											}`}
										>
											<NodeIcon
												className={`h-[24px] w-[24px] transition-colors duration-500 motion-reduce:transition-none ${
													isActive ? "text-white" : "text-[#03442C]"
												}`}
												strokeWidth={1.5}
											/>
										</div>
										<p
											className={`mt-2 text-base font-semibold leading-tight transition-colors duration-500 motion-reduce:transition-none ${
												isActive ? "text-[#1C1C1C]" : "text-[#4A4A4A]"
											}`}
										>
											{actor.label}
										</p>
									</button>
								);
							})}

							{/* Center logo */}
							<div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
								<div className="flex h-[100px] w-[100px] items-center justify-center rounded-full border border-[#03442C]/20 bg-white">
									<img
										src="/logo-short.svg"
										alt="GreenShift"
										className="h-[48px] w-auto"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Right: Selected node detail */}
					<article className="flex flex-col gap-8">
						<div className="flex items-center gap-4">
							<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#03442C]/20 bg-[#03442C]/5">
								<Icon
									className="h-[24px] w-[24px] text-[#03442C]"
									strokeWidth={1.5}
								/>
							</div>
							<h3 className="text-[32px] font-bold leading-[1.2] text-[#1C1C1C]">
								{selected.label}
							</h3>
						</div>
						<p className="text-[22px] font-medium leading-[1.6] text-[#03442C]">
							{selected.tagline}
						</p>
						<p className="text-[22px] leading-[1.8] text-[#555]">
							{selected.detail}
						</p>
					</article>
				</div>
			</div>
		</section>
	);
}
