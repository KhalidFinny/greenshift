import {
	faBell,
	faBriefcase,
	faChartLine,
	faChevronDown,
	faChevronUp,
	faCircleUser,
	faCoins,
	faFileLines,
	faGauge,
	faLayerGroup,
	faRightFromBracket,
	faServer,
	faTruck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { cn } from "../lib/utils";
import { useRoleShell } from "./use-role-shell";

interface RoleShellProps {
	children: ReactNode;
	title: string;
	navItems: Array<{ to: string; label: string }>;
}

export function RoleShell({ children, title, navItems }: RoleShellProps) {
	const {
		name,
		initials,
		homeHref,
		activePath,
		accountRef,
		accountMenuOpen,
		toggleAccountMenu,
		openProfile,
		handleLogout,
	} = useRoleShell();
	const activeNavLabel =
		navItems.find((item) => item.to === activePath)?.label ?? title;

	return (
		<div className="flex h-screen overflow-hidden">
			<aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-white text-sidebar-foreground">
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-[url('/skysidebar.webp')] bg-[length:150%] bg-bottom bg-no-repeat opacity-20 grayscale"
				/>
				<div className="relative flex h-full flex-col">
					<div className="p-4">
						<Link to={homeHref} className="flex justify-center no-underline">
							<img src="/logo-long.svg" alt="GreenShift" className="w-40" />
						</Link>
					</div>

					<nav
						className="flex-1 space-y-4 px-3 pb-3 pt-8"
						aria-label="Menu sidebar"
					>
						{navItems.map((item) => {
							const isActive = activePath === item.to;
							const icon =
								item.label === "Dashboard"
									? faGauge
									: item.label === "Analytics"
										? faChartLine
										: item.label === "Projects"
											? faBriefcase
											: item.label === "Portfolio"
												? faCoins
												: item.label === "Green Market"
													? faLayerGroup
													: item.label === "Vendors"
														? faTruck
														: item.label === "System"
															? faServer
															: faFileLines;
							return (
								<Link
									key={item.to}
									to={item.to}
									aria-current={isActive ? "page" : undefined}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-sidebar-foreground transition-colors",
										isActive
											? "bg-primary font-semibold text-primary-foreground"
											: "hover:bg-foreground/5 hover:text-foreground",
									)}
								>
									<FontAwesomeIcon icon={icon} className="size-4 shrink-0" />
									{item.label}
								</Link>
							);
						})}
					</nav>

					<footer className="border-t border-border p-3">
						<p className="text-center text-sm text-sidebar-foreground/60">
							GreenShift · 2026
						</p>
					</footer>
				</div>
			</aside>

			<main className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<header className="sticky top-0 z-10 flex items-center justify-between bg-background px-6 py-4">
					<div className="text-2xl font-semibold text-foreground">
						{activeNavLabel}
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							aria-label="Notifikasi"
							className="flex size-10 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
						>
							<FontAwesomeIcon icon={faBell} className="size-5" />
						</button>

						<div ref={accountRef} className="relative">
							<button
								type="button"
								onClick={toggleAccountMenu}
								aria-haspopup="menu"
								aria-expanded={accountMenuOpen}
								className="flex items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-foreground/5"
							>
								<Avatar>
									<AvatarFallback className="bg-foreground/10 font-semibold text-foreground">
										{initials}
									</AvatarFallback>
								</Avatar>
								<span className="hidden min-w-0 md:block">
									<span className="block truncate text-sm font-semibold text-foreground">
										{name || "Pengguna"}
									</span>
								</span>
								<FontAwesomeIcon
									icon={accountMenuOpen ? faChevronUp : faChevronDown}
									className="hidden size-4 shrink-0 text-sidebar-foreground/60 md:block"
								/>
							</button>

							{accountMenuOpen && (
								<div
									role="menu"
									className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-lg border border-border bg-white shadow-lg"
								>
									<div className="border-b border-border px-4 py-3">
										<p className="truncate text-sm font-semibold text-foreground">
											{name || "Pengguna"}
										</p>
										<p className="truncate text-sm text-primary">{title}</p>
									</div>
									<button
										type="button"
										role="menuitem"
										onClick={openProfile}
										className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
									>
										<FontAwesomeIcon
											icon={faCircleUser}
											className="size-4 shrink-0"
										/>
										Profile
									</button>
									<button
										type="button"
										role="menuitem"
										onClick={handleLogout}
										className="flex w-full items-center gap-3 border-t border-border px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
									>
										<FontAwesomeIcon
											icon={faRightFromBracket}
											className="size-4 shrink-0"
										/>
										Logout
									</button>
								</div>
							)}
						</div>
					</div>
				</header>

				<div className="flex-1 overflow-y-auto px-6 py-8">{children}</div>
			</main>
		</div>
	);
}
