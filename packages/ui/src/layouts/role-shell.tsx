import {
	faBell,
	faBriefcase,
	faChartLine,
	faChartPie,
	faChevronDown,
	faChevronUp,
	faCircleUser,
	faClipboardList,
	faFileLines,
	faGavel,
	faGauge,
	faGear,
	faHandshake,
	faLayerGroup,
	faLeaf,
	faRightFromBracket,
	faServer,
	faTasks,
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

function getSidebarIcon(item: { to: string; label: string }) {
	const to = item.to.toLowerCase();
	const label = item.label.toLowerCase();

	if (
		to === "/vendor" ||
		to === "/investor" ||
		to === "/admin" ||
		to === "/business" ||
		label === "dashboard"
	) {
		return faGauge;
	}
	if (
		to.includes("deals") ||
		label.includes("deal")
	) {
		return faHandshake;
	}
	if (
		to.includes("opportunities") ||
		label.includes("opportunit")
	) {
		return faLeaf;
	}
	if (to.includes("tenders") || label.includes("tender") || label.includes("lelang")) {
		return faGavel;
	}
	if (to.includes("active-projects") || label.includes("active")) {
		return faTasks;
	}
	if (
		to.includes("portfolio") ||
		label.includes("portfolio") ||
		to.includes("performance") ||
		label.includes("performance") ||
		label.includes("kinerja")
	) {
		return faBriefcase;
	}
	if (
		to.includes("settings") ||
		label.includes("settings") ||
		label.includes("pengaturan")
	) {
		return faGear;
	}
	if (to.includes("projects") || label.includes("projects") || label.includes("proyek")) {
		return faLeaf;
	}
	if (to.includes("analytics") || label.includes("analytics")) {
		return faChartPie;
	}
	if (to.includes("monthly-report") || label.includes("monthly report")) {
		return faChartLine;
	}
	if (to.includes("market") || label.includes("market")) {
		return faLayerGroup;
	}
	if (to.includes("vendors") || label.includes("vendors")) {
		return faTruck;
	}
	if (to.includes("system") || label.includes("system")) {
		return faServer;
	}
	if (to.includes("audit") || label.includes("audit")) {
		return faClipboardList;
	}

	return faFileLines;
}

export function RoleShell({ children, title, navItems }: RoleShellProps) {
	const {
		user,
		name,
		initials,
		homeHref,
		activePath,
		accountRef,
		accountMenuOpen,
		toggleAccountMenu,
		notifRef,
		notifMenuOpen,
		toggleNotifMenu,
		closeNotifMenu,
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
						aria-label="Sidebar menu"
					>
						{navItems.map((item) => {
							const isActive = activePath === item.to;
							const icon = getSidebarIcon(item);
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
t				{/* Bell Icon Notification Dropdown Section */}
					<div ref={notifRef} className="relative">
						<button
							type="button"
							onClick={toggleNotifMenu}
							aria-label="Notifikasi"
							className="relative flex size-10 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
						>
							<FontAwesomeIcon icon={faBell} className="size-5" />
							<span className="absolute right-2 top-2 flex size-2 rounded-full bg-emerald-600 ring-2 ring-white" />
						{/* Bell Icon Notification Dropdown Section */}
						<div ref={notifRef} className="relative">
							<button
								type="button"
								onClick={toggleNotifMenu}
								aria-label="Notifikasi"
								className="relative flex size-10 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
							>
								<FontAwesomeIcon icon={faBell} className="size-5" />
								<span className="absolute right-2 top-2 flex size-2 rounded-full bg-emerald-600 ring-2 ring-white" />
							</button>

							{notifMenuOpen && (
								<div
									role="menu"
									className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-border bg-white shadow-xl z-50"
								>
									<div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
										<div className="flex items-center gap-2">
											<FontAwesomeIcon icon={faBell} className="size-4 text-emerald-600" />
											<span className="text-sm font-semibold text-foreground">
												Pusat Notifikasi
											</span>
										</div>
										<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
											2 Baru
										</span>
									</div>

									<div className="max-h-72 overflow-y-auto divide-y divide-border text-xs">
										<Link
											to={user ? (`/${user.role}/notifications` as any) : "/vendor/notifications"}
											onClick={closeNotifMenu}
											className="block p-3 transition-colors hover:bg-muted/50 no-underline"
										>
											<div className="flex items-start gap-2.5">
												<span className="mt-1 size-2 rounded-full bg-blue-500 shrink-0" />
												<div>
													<p className="font-semibold text-foreground">
														Permintaan Negosiasi Baru
													</p>
													<p className="mt-0.5 text-muted-foreground line-clamp-2">
														PT Sentra Graha Medika mengajukan revisi harga & garansi.
													</p>
													<span className="mt-1 block text-[10px] text-muted-foreground">
														10 menit yang lalu
													</span>
												</div>
											</div>
										</Link>

										<Link
											to={user ? (`/${user.role}/notifications` as any) : "/vendor/notifications"}
											onClick={closeNotifMenu}
											className="block p-3 transition-colors hover:bg-muted/50 no-underline"
										>
											<div className="flex items-start gap-2.5">
												<span className="mt-1 size-2 rounded-full bg-emerald-500 shrink-0" />
												<div>
													<p className="font-semibold text-foreground">
														Perubahan Peringkat Lelang
													</p>
													<p className="mt-0.5 text-muted-foreground line-clamp-2">
														Tawaran Anda pada Solar PV Pabrik Tekstil berada di posisi 2.
													</p>
													<span className="mt-1 block text-[10px] text-muted-foreground">
														2 jam yang lalu
													</span>
												</div>
											</div>
										</Link>
									</div>

									<div className="border-t border-border bg-muted/20 p-2.5 text-center">
										<Link
											to={user ? (`/${user.role}/notifications` as any) : "/vendor/notifications"}
											onClick={closeNotifMenu}
											className="block rounded-lg py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors no-underline"
										>
											Lihat Semua Notifikasi →
										</Link>
									</div>
								</div>
							)}
						</div>

						{/* User Profile Avatar Dropdown */}
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
										{name || "User"}
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
											{name || "User"}
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
