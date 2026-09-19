import {
	faBars,
	faBell,
	faBellSlash,
	faBriefcase,
	faChartLine,
	faChartPie,
	faChevronDown,
	faChevronUp,
	faCircleUser,
	faClipboardList,
	faFileLines,
	faGauge,
	faGavel,
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
import { api } from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { AccountAvatar } from "../components/account-avatar";
import { ShimmerBlock } from "../components/loaders/skeleton-loader";
import { cn } from "../lib/utils";
import { useRoleShell } from "./use-role-shell";

interface RoleShellProps {
	children: ReactNode;
	title: string;
	navItems: Array<{ to: string; label: string }>;
	showHeaderTitle?: boolean;
}

/** Roles with a real notification feed. The others get no bell at all, since a
 * control with nothing behind it is worse than no control. */
const ROLES_WITH_FEED: Record<string, true> = {
	vendor: true,
	broker: true,
	business: true,
};

interface ShellNotification {
	id: number;
	title: string;
	body: string | null;
	link: string | null;
	read: boolean;
	createdAt: string;
}

function relativeTime(iso: string): string {
	const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.round(hours / 24)}d ago`;
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
	if (to.includes("deals") || label.includes("deal")) {
		return faHandshake;
	}
	if (to.includes("opportunities") || label.includes("opportunit")) {
		return faLeaf;
	}
	if (
		to.includes("tenders") ||
		label.includes("tender") ||
		label.includes("lelang")
	) {
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
	if (
		to.includes("projects") ||
		label.includes("projects") ||
		label.includes("proyek")
	) {
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

export function RoleShell({
	children,
	title,
	navItems,
	showHeaderTitle = true,
}: RoleShellProps) {
	const {
		user,
		name,
		homeHref,
		activePath,
		accountRef,
		accountMenuOpen,
		toggleAccountMenu,
		notifRef,
		notifMenuOpen,
		toggleNotifMenu,
		closeNotifMenu,
		closeAccountMenu,
		handleLogout,
	} = useRoleShell();
	const activeNavLabel =
		navItems.find((item) => item.to === activePath)?.label ?? title;

	const role = user?.role ?? "";
	const hasFeed = ROLES_WITH_FEED[role] === true;

	const notificationsQuery = useQuery({
		queryKey: ["shell-notifications", role],
		enabled: hasFeed,
		staleTime: 60 * 1000,
		queryFn: async (): Promise<ShellNotification[]> => {
			if (role === "vendor") {
				const { notifications } = await api.vendor.notifications({ limit: 5 });
				return notifications.map((n) => ({
					id: n.id,
					title: n.title,
					body: n.body,
					link: n.link,
					read: n.read,
					createdAt: n.createdAt,
				}));
			}
			if (role === "business") {
				const { notifications } = await api.business.notifications({
					limit: 5,
				});
				return notifications.map((n) => ({
					id: n.id,
					title: n.title,
					body: n.body,
					link: n.link,
					read: n.read,
					createdAt: n.createdAt,
				}));
			}
			if (role === "broker") {
				const { notifications } = await api.broker.notifications({ limit: 5 });
				return notifications.map((n) => ({
					id: n.id,
					title: n.title,
					body: n.message,
					link: n.linkUrl,
					read: n.isRead,
					createdAt: n.createdAt,
				}));
			}
			return [];
		},
	});

	const notifications = notificationsQuery.data ?? [];
	const unreadCount = notifications.filter((n) => !n.read).length;

	// Settings replaces the old standalone profile page, and only exists for the
	// roles that actually have one.
	const settingsPath =
		role === "vendor"
			? "/vendor/settings"
			: role === "broker"
				? "/broker/settings"
				: null;

	// Mobile navigation. The sidebar stays ONE element at every width: below `lg`
	// it slides in over the content rather than being duplicated into a second
	// copy, which would give two elements the same view-transition name and
	// break the page transition.
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// Navigating closes it: the drawer covers the page the user just chose.
	useEffect(() => {
		setSidebarOpen(false);
	}, [activePath]);

	useEffect(() => {
		if (!sidebarOpen) return;
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") setSidebarOpen(false);
		}
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [sidebarOpen]);

	return (
		<div className="fixed inset-0 flex w-full overflow-hidden overscroll-none">
			{/* Dimming layer for the mobile drawer. Below `lg` only, and it is the
			    only place the sidebar can be dismissed by tapping outside it. */}
			{sidebarOpen ? (
				<button
					type="button"
					aria-label="Close navigation menu"
					onClick={() => setSidebarOpen(false)}
					className="fixed inset-0 z-40 cursor-default bg-black/40 lg:hidden"
				/>
			) : null}
			<aside
				id="shell-sidebar"
				data-shell-sidebar
				className={cn(
					// Off-canvas below `lg`, docked beside the content from `lg` up.
					"fixed inset-y-0 left-0 z-50 flex h-dvh w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-white text-sidebar-foreground transition-transform duration-200 ease-out",
					"lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:self-start lg:transition-none",
					sidebarOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-[url('/skysidebar.webp')] bg-[length:150%] bg-bottom bg-no-repeat opacity-20 grayscale"
				/>
				<div className="relative flex h-full flex-col">
					<div className="p-4">
						<Link
							to={homeHref}
							className="flex min-h-11 items-center justify-center no-underline"
						>
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
										"flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-sidebar-foreground transition-colors",
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
				</div>
			</aside>

			<main className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<header
					data-shell-header
					className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2 sm:gap-3 sm:px-6 sm:py-4"
				>
					<div className="flex min-w-0 items-center gap-1 sm:gap-2">
						{/* Labelled rather than a bare icon: a hamburger with no word
						    assumes the user knows what hides behind it. */}
						<button
							type="button"
							onClick={() => setSidebarOpen(true)}
							aria-expanded={sidebarOpen}
							aria-controls="shell-sidebar"
							className="-ml-1 flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground lg:hidden"
						>
							<FontAwesomeIcon icon={faBars} className="size-5" />
							Menu
						</button>
						{showHeaderTitle ? (
							<div className="truncate text-lg font-semibold text-foreground sm:text-2xl">
								{activeNavLabel}
							</div>
						) : (
							<div aria-hidden="true" />
						)}
					</div>
					<div className="flex items-center gap-3">
						{/* Notifications. Only roles with a real feed get the bell; for the
						    rest it would be a control with nothing behind it. */}
						{hasFeed ? (
							<div ref={notifRef} className="relative">
								<button
									type="button"
									onClick={toggleNotifMenu}
									aria-label={
										unreadCount > 0
											? `Notifications, ${unreadCount} unread`
											: "Notifications"
									}
									className="relative flex size-11 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
								>
									<FontAwesomeIcon icon={faBell} className="size-5" />
									{unreadCount > 0 ? (
										<span className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white ring-2 ring-white">
											{unreadCount > 9 ? "9+" : unreadCount}
										</span>
									) : null}
								</button>

								{notifMenuOpen ? (
									<div
										role="menu"
										className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-3rem))] overflow-hidden rounded-xl border border-border bg-white shadow-xl"
									>
										<div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
											<span className="text-sm font-semibold text-foreground">
												Notifications
											</span>
											{unreadCount > 0 ? (
												<span className="rounded-md bg-emerald-700 px-2 py-0.5 text-sm font-semibold text-white">
													{unreadCount} unread
												</span>
											) : null}
										</div>

										{notificationsQuery.isPending ? (
											<div className="space-y-3 p-3">
												{Array.from({ length: 3 }).map((_, i) => (
													<ShimmerBlock key={i} className="h-14 w-full" />
												))}
											</div>
										) : notifications.length === 0 ? (
											<div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
												<div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
													<FontAwesomeIcon
														icon={faBellSlash}
														className="size-4"
													/>
												</div>
												<p className="text-sm font-semibold text-foreground">
													Nothing needs you
												</p>
												<p className="text-sm text-muted-foreground">
													Ranking changes and client requests land here.
												</p>
											</div>
										) : (
											<div className="max-h-72 divide-y divide-border overflow-y-auto">
												{notifications.map((item) => {
													const row = (
														<div className="flex items-start gap-2.5">
															<span
																aria-hidden="true"
																className={cn(
																	"mt-1 size-2 shrink-0 rounded-full",
																	item.read ? "bg-border" : "bg-emerald-700",
																)}
															/>
															<div className="min-w-0">
																<p className="text-sm font-semibold text-foreground">
																	{item.title}
																</p>
																{item.body ? (
																	<p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
																		{item.body}
																	</p>
																) : null}
																<span className="mt-1 block text-sm text-muted-foreground">
																	{relativeTime(item.createdAt)}
																</span>
															</div>
														</div>
													);
													const rowClass =
														"block p-3 no-underline transition-colors hover:bg-muted/50";
													return item.link ? (
														<a
															key={item.id}
															href={item.link}
															onClick={closeNotifMenu}
															className={rowClass}
														>
															{row}
														</a>
													) : (
														<div key={item.id} className="p-3">
															{row}
														</div>
													);
												})}
											</div>
										)}

										{role === "vendor" ? (
											<div className="border-t border-border bg-muted/20 p-2.5 text-center">
												<Link
													to="/vendor/notifications"
													onClick={closeNotifMenu}
													className="block rounded-lg py-1.5 text-sm font-semibold text-emerald-700 no-underline transition-colors hover:bg-emerald-50"
												>
													View all notifications
												</Link>
											</div>
										) : null}
									</div>
								) : null}
							</div>
						) : null}
						<div ref={accountRef} className="relative">
							<button
								type="button"
								onClick={toggleAccountMenu}
								aria-haspopup="menu"
								aria-expanded={accountMenuOpen}
								aria-label={`Account menu for ${name || "your account"}`}
								className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-left transition-colors hover:bg-foreground/5"
							>
								<AccountAvatar
									name={name}
									avatarKey={user?.avatarKey ?? null}
									className="size-8"
									fallbackClassName="bg-foreground/10 font-semibold text-foreground"
								/>
								<span className="hidden max-w-40 truncate text-base font-medium text-foreground sm:block">
									{name || "Pengguna"}
								</span>
								<FontAwesomeIcon
									icon={accountMenuOpen ? faChevronUp : faChevronDown}
									className="hidden size-4 shrink-0 text-muted-foreground sm:block"
								/>
							</button>
							{accountMenuOpen && (
								<div
									role="menu"
									className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-white shadow-lg"
								>
									{settingsPath ? (
										<Link
											to={settingsPath}
											role="menuitem"
											onClick={closeAccountMenu}
											className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground no-underline transition-colors hover:bg-foreground/5"
										>
											<FontAwesomeIcon
												icon={faCircleUser}
												className="size-4 shrink-0"
											/>
											Profile
										</Link>
									) : null}
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

				<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-16 sm:px-6 sm:pt-8 sm:pb-20">
					{children}
				</div>
			</main>
		</div>
	);
}
