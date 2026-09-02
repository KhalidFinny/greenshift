import { useAuth } from "@greenshift/core";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useIsHome } from "../../hooks/useIsHome";
import { cn } from "../../lib/utils";
import { buttonVariants } from "../ui/button";

const navLinks = [
	{ href: "#hero", label: "home" },
	{ href: "#cara-kerja", label: "cara kerja" },
	{ href: "#ekosistem", label: "ekosistem" },
	{ href: "#faq", label: "faq" },
	{ href: "#hubungi-kami", label: "kontak" },
] as const;

export default function Header({
	variant = "default",
}: {
	variant?: "default" | "transparent";
}) {
	const { user } = useAuth();
	const isHome = useIsHome();

	// The landing page keeps the public header even when logged in;
	// authenticated pages have no header, the sidebar spans full height.
	if (user && !isHome) return null;

	return <PublicHeader variant={variant} />;
}

function PublicHeader({ variant }: { variant: "default" | "transparent" }) {
	const [scrolled, setScrolled] = useState(false);

	// On the landing page the transparent header lives over the hero and scrolls
	// away with it; once the viewport reaches the hero's fade-to-white bridge a
	// compact fixed header fades in, shrinking to ~68% of the viewport width.
	useEffect(() => {
		const onScroll = () =>
			setScrolled(window.scrollY > window.innerHeight * 0.8);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	if (variant === "default") {
		return (
			<header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background">
				<HeaderNav onDark={false} />
			</header>
		);
	}

	return (
		<>
			<header className="absolute inset-x-0 top-0 z-40 border-b border-transparent bg-transparent">
				<HeaderNav onDark />
			</header>

			{/* Compact floating header: brand green so the white logo works on
				both landing headers (hero + compact) — no logo swap needed. */}
			<header
				aria-hidden={!scrolled}
				style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
				className={cn(
					"fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-xl bg-[#03442C] shadow-lg transition-all duration-500",
					scrolled
						? "w-[92%] opacity-100 sm:w-[68%]"
						: "pointer-events-none w-full opacity-0",
				)}
			>
				<HeaderNav onDark />
			</header>
		</>
	);
}

function HeaderNav({ onDark }: { onDark: boolean }) {
	const isHome = useIsHome();

	return (
		<nav
			className="page-wrap flex items-center justify-between py-4"
			aria-label="Navigasi utama"
		>
			<Link to="/" className="no-underline">
				<img
					src={onDark ? "/logo-white.webp" : "/logo-long.svg"}
					alt="GreenShift"
					className="h-12"
				/>
			</Link>

			<ul className="flex items-center gap-10 m-0 list-none">
				{navLinks.map((link) => {
					const isActive = link.href === "#hero" && isHome;
					return (
						<li key={link.label}>
							<a
								href={link.href}
								className={cn(
									"relative py-1 text-base font-medium no-underline transition-colors duration-200",
									onDark
										? isActive
											? "text-white"
											: "text-white/85 hover:text-white"
										: isActive
											? "text-foreground"
											: "text-muted-foreground hover:text-foreground",
								)}
							>
								{link.label}
								{isActive && (
									<span
										className={cn(
											"absolute -bottom-1 left-0 h-[2px] w-full rounded-full transition-all duration-300",
											onDark ? "bg-white" : "bg-primary",
										)}
										aria-hidden="true"
									/>
								)}
							</a>
						</li>
					);
				})}
			</ul>

			<div className="flex items-center gap-3">
				<Link
					to="/login"
					className={cn(
						buttonVariants(),
						"h-[42px] cursor-pointer rounded-[10px] px-6 text-base normal-case tracking-normal",
						onDark
							? "bg-white text-black hover:bg-white/90"
							: "border border-border bg-white text-black hover:bg-foreground/5",
					)}
				>
					Login
				</Link>
				<Link
					to="/register"
					className={cn(
						buttonVariants({ variant: "outline" }),
						"h-[42px] cursor-pointer rounded-[10px] px-6 text-base normal-case tracking-normal",
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
