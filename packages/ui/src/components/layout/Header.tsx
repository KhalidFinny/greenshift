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
	const isHome = useIsHome();
	const [scrolled, setScrolled] = useState(false);

	// Transparent only while the hero section is on screen; solid once the
	// viewport top reaches the hero's fade-to-white bridge.
	useEffect(() => {
		const onScroll = () =>
			setScrolled(window.scrollY > window.innerHeight * 0.8);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const isTransparent = variant === "transparent" && !scrolled;

	return (
		<header
			className={cn(
				"fixed inset-x-0 top-0 z-50 transition-colors duration-300",
				isTransparent
					? "border-b border-transparent bg-transparent"
					: "border-b border-border bg-background",
			)}
		>
			<nav
				className="page-wrap flex items-center justify-between py-4"
				aria-label="Navigasi utama"
			>
				<Link to="/" className="no-underline">
					<img
						src={isTransparent ? "/logo-white.webp" : "/logo-long.svg"}
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
										isTransparent
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
												isTransparent ? "bg-white" : "bg-primary",
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
							isTransparent
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
							isTransparent
								? "border-white/60 text-white hover:bg-white hover:text-black"
								: "text-foreground hover:bg-white hover:text-black",
						)}
					>
						Register
					</Link>
				</div>
			</nav>
		</header>
	);
}
