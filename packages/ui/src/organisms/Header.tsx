import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buttonVariants } from "../atoms/button";
import { useIsHome } from "../hooks/useIsHome";
import { cn } from "../lib/utils";

const navLinks = [
	{ href: "#hero", label: "Home" },
	{ href: "#how-it-works", label: "How It Works" },
	{ href: "#ecosystem", label: "Ecosystem" },
	{ href: "#faq", label: "FAQ" },
	{ href: "#contact", label: "Contact" },
] as const;

const compactBar =
	"fixed left-1/2 top-3 z-50 -translate-x-1/2 -translate-y-2 w-[90%] rounded-xl bg-[#03442C] shadow-lg transition-all duration-500 opacity-60 hover:opacity-100 hover:translate-y-0 scale-[0.97] hover:scale-100";

/** Navigates to "/" first, then glides to the section, instead of letting the router hard-jump to the hash. */
function smoothScrollToSection(href: string) {
	const id = href.replace(/^#/, "");
	const startedAt = Date.now();
	const timer = setInterval(() => {
		const target = document.getElementById(id);
		if (target) {
			clearInterval(timer);
			requestAnimationFrame(() =>
				requestAnimationFrame(() =>
					target.scrollIntoView({ behavior: "smooth", block: "start" }),
				),
			);
		} else if (Date.now() - startedAt > 1500) {
			clearInterval(timer);
		}
	}, 50);
}

export default function Header() {
	return <LandingHeader />;
}

function LandingHeader() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () =>
			setScrolled(window.scrollY > window.innerHeight * 0.8);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<>
			{/* The hero is full-bleed: the bar sits clear of the viewport edge, so the logo's top edge lands 24px down. */}
			<header className="absolute inset-x-0 top-4 z-40 border-b border-transparent bg-transparent">
				<HeaderNav onDark />
			</header>

			{/* Brand green so the white logo works on both landing headers, with no logo swap. */}
			<header
				aria-hidden={!scrolled}
				style={{
					transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
				}}
				className={cn(
					compactBar,
					scrolled ? "opacity-60" : "pointer-events-none opacity-0",
				)}
			>
				<HeaderNav onDark />
			</header>
		</>
	);
}

function HeaderNav({ onDark }: { onDark: boolean }) {
	const isHome = useIsHome();
	const navigate = useNavigate();
	const [activeSection, setActiveSection] = useState("#hero");

	useEffect(() => {
		if (!isHome) return;

		const onScroll = () => {
			const sections = navLinks.map((l) => l.href.replace("#", ""));
			let current = "#hero";
			for (const id of sections) {
				const el = document.getElementById(id);
				if (el) {
					const rect = el.getBoundingClientRect();
					if (rect.top <= 120) current = `#${id}`;
				}
			}
			setActiveSection(current);
		};

		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [isHome]);

	return (
		<nav
			className="page-wrap flex items-center justify-between gap-4 py-2"
			aria-label="Main navigation"
		>
			<Link to="/" className="shrink-0 no-underline">
				<img
					src={onDark ? "/logo-white.webp" : "/logo-long.svg"}
					alt="GreenShift"
					className={onDark ? "h-11" : "h-10"}
				/>
			</Link>

			<ul className="m-0 hidden list-none items-center gap-1 md:flex">
				{navLinks.map((link) => {
					const isActive = isHome && activeSection === link.href;
					const className = cn(
						"px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-all duration-200",
						onDark
							? isActive
								? "bg-white/20 text-white"
								: "text-white/70 hover:text-white hover:bg-white/10"
							: isActive
								? "bg-[#00712D]/10 text-[#00712D]"
								: "text-[#5A6B66] hover:text-[#1C1C1C] hover:bg-[#00712D]/5",
					);
					return isHome ? (
						<li key={link.label}>
							<a
								href={link.href}
								onClick={(event) => {
									event.preventDefault();
									smoothScrollToSection(link.href);
								}}
								className={className}
							>
								{link.label}
							</a>
						</li>
					) : (
						<li key={link.label}>
							<a
								href={`/#${link.href.slice(1)}`}
								onClick={(event) => {
									event.preventDefault();
									navigate({ to: "/" });
									smoothScrollToSection(link.href);
								}}
								className={className}
							>
								{link.label}
							</a>
						</li>
					);
				})}
				<li>
					<Link
						to="/bonds"
						className={cn(
							"px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-all duration-200",
							onDark
								? "text-white/70 hover:text-white hover:bg-white/10"
								: "text-[#5A6B66] hover:text-[#1C1C1C] hover:bg-[#03442C]/5",
						)}
					>
						Bonds
					</Link>
				</li>
			</ul>

			<div className="flex shrink-0 items-center gap-2.5">
				<Link
					to="/login"
					className={cn(
						buttonVariants(),
						"h-8 cursor-pointer rounded-lg px-4 text-sm normal-case tracking-normal",
						onDark
							? "bg-white text-black hover:bg-white/90"
							: "border border-border bg-white text-black hover:bg-foreground/5",
					)}
				>
					Login
				</Link>
				{/* On a phone the bar has room for the brand and one action; the hero's "Get Started Free" is the signup path there. */}
				<Link
					to="/register"
					className={cn(
						buttonVariants({ variant: "outline" }),
						"h-8 max-sm:hidden cursor-pointer rounded-lg px-4 text-sm normal-case tracking-normal",
						onDark
							? "border-white/60 text-white hover:bg-white hover:text-black"
							: "text-foreground hover:bg-white hover:text-black",
					)}
				>
					Register
				</Link>
			</div>
		</nav>
	);
}
