import { useAuth } from "@greenshift/core";
import { Link } from "@tanstack/react-router";
import { useIsHome } from "../../hooks/useIsHome";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const navLinks = [
	{ href: "#hero", label: "home" },
	{ href: "#cara-kerja", label: "cara kerja" },
	{ href: "#fitur", label: "fitur" },
	{ href: "#ekosistem", label: "ekosistem" },
] as const;

export default function Header({
	variant = "default",
}: {
	variant?: "default" | "transparent";
}) {
	const { user } = useAuth();
	const isHome = useIsHome();

	// The landing page keeps the public header even when logged in;
	// authenticated pages have no header — the sidebar spans full height.
	if (user && !isHome) return null;

	return <PublicHeader variant={variant} />;
}

function PublicHeader({ variant }: { variant: "default" | "transparent" }) {
	const isTransparent = variant === "transparent";
	const isHome = useIsHome();

	return (
		<header
			className={cn(
				"top-0 z-50",
				isTransparent
					? "absolute inset-x-0 bg-transparent"
					: "sticky border-b border-border bg-background",
			)}
		>
			<nav
				className="page-wrap flex items-center justify-between py-4"
				aria-label="Navigasi utama"
			>
				<Link to="/" className="no-underline">
					<img
						src={isTransparent ? "/logo-white.png" : "/logo-long.svg"}
						alt="GreenShift"
						className={cn("h-12", !isTransparent && "brightness-0 invert")}
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
										"relative py-1 text-[15px] font-medium no-underline transition-colors duration-200",
										isTransparent
											? isActive
												? "text-white"
												: "text-white/60 hover:text-white"
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
					<Button
						className={cn(
							"h-[42px] cursor-pointer rounded-[10px] px-6 text-[14px] normal-case tracking-normal",
							isTransparent
								? "bg-white text-black hover:bg-white/90"
								: "border border-border bg-white text-black hover:bg-foreground/5",
						)}
					>
						<Link to="/login" className="no-underline">
							Login
						</Link>
					</Button>
					<Button
						variant="outline"
						className={cn(
							"h-[42px] cursor-pointer rounded-[10px] px-6 text-[14px] normal-case tracking-normal",
							isTransparent
								? "border-white/60 text-white hover:bg-white hover:text-black"
								: "text-foreground hover:bg-white hover:text-black",
						)}
					>
						<Link to="/register" className="no-underline">
							Register
						</Link>
					</Button>
				</div>
			</nav>
		</header>
	);
}
