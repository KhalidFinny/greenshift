import {
	faBell,
	faBriefcase,
	faChartLine,
	faChevronDown,
	faChevronUp,
	faCircleQuestion,
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
	helpCard?: boolean;
	showHeaderTitle?: boolean;
}

export function RoleShell({
	children,
	title,
	navItems,
	helpCard = false,
	showHeaderTitle = true,
}: RoleShellProps) {
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
		<div className="fixed inset-0 flex w-full overflow-hidden overscroll-none">
			<aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col self-start overflow-hidden border-r border-border bg-white text-sidebar-foreground">
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

					<div className="mt-auto flex flex-col gap-4">
						{helpCard && (
							<div className="px-3">
								<div className="rounded-lg bg-card p-3 ring-1 ring-foreground/10">
									<div className="flex items-start gap-2">
										<FontAwesomeIcon
											icon={faCircleQuestion}
											className="mt-0.5 size-4 shrink-0"
										/>
										<div className="min-w-0">
											<p className="text-base font-semibold">Butuh bantuan?</p>
											<p className="mt-1 text-base text-muted-foreground">
												Tim GreenShift siap membantu pengisian data energi.
											</p>
										</div>
									</div>
								</div>
							</div>
						)}
						<footer className="border-t border-border p-3">
							<div
								ref={accountRef}
								className="relative rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
							>
								<button
									type="button"
									onClick={toggleAccountMenu}
									aria-haspopup="menu"
									aria-expanded={accountMenuOpen}
									className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-foreground/5"
								>
									<Avatar>
										<AvatarFallback className="bg-foreground/10 font-semibold text-foreground">
											{initials}
										</AvatarFallback>
									</Avatar>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-base font-semibold text-foreground">
											{name || "Pengguna"}
										</span>
										<span className="block truncate text-base text-muted-foreground">
											{title}
										</span>
									</span>
									<FontAwesomeIcon
										icon={accountMenuOpen ? faChevronUp : faChevronDown}
										className="size-4 shrink-0 text-sidebar-foreground/60"
									/>
								</button>
								{accountMenuOpen && (
									<div
										role="menu"
										className="absolute bottom-full right-0 left-0 z-50 mb-2 overflow-hidden rounded-lg border border-border bg-white shadow-lg"
									>
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
						</footer>
					</div>
				</div>
			</aside>

			<main className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<header className="sticky top-0 z-10 flex items-center justify-between bg-background px-6 py-4">
					{showHeaderTitle ? (
						<div className="text-2xl font-semibold text-foreground">
							{activeNavLabel}
						</div>
					) : (
						<div aria-hidden="true" />
					)}
					<div className="flex items-center gap-3">
						<button
							type="button"
							aria-label="Notifikasi"
							className="flex size-10 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
						>
							<FontAwesomeIcon icon={faBell} className="size-5" />
						</button>
					</div>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-8 pb-20">
					{children}
				</div>
			</main>
		</div>
	);
}
