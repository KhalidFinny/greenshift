import {
	faBars,
	faBell,
	faBellSlash,
	faBriefcase,
	faChartLine,
	faChartPie,
	faCheck,
	faChevronDown,
	faChevronUp,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { AccountAvatar } from "../components/account-avatar";
import { ShimmerBlock } from "../components/loaders/skeleton-loader";
import { relativeTime } from "../lib/time";
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

/** How many the hub lists. Deeper history belongs on a notifications page. */
const HUB_LIMIT = 20;

interface ShellNotification {
	id: number;
	title: string;
	body: string | null;
	link: string | null;
	read: boolean;
	createdAt: string;
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
		// Events the company is waiting on (a submission's verification) are
		// written after the request that caused them, so the feed polls for them
		// rather than only loading when the shell mounts.
		refetchInterval: 10 * 1000,
		queryFn: async (): Promise<ShellNotification[]> => {
			if (role === "vendor") {
				const { notifications } = await api.vendor.notifications({
					limit: HUB_LIMIT,
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
			if (role === "business") {
				const { notifications } = await api.business.notifications({
					limit: HUB_LIMIT,
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
				const { notifications } = await api.broker.notifications({
					limit: HUB_LIMIT,
				});
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

	/**
	 * Reading is a write, so the hub marks as it goes: opening an item marks that
	 * one, and the header's action marks the whole feed. Both patch the cached
	 * list first, so the badge clears as the request leaves rather than after the
	 * next poll.
	 */
	const queryClient = useQueryClient();
	const notificationsKey = ["shell-notifications", role];

	function markRead(id: number) {
		queryClient.setQueryData<ShellNotification[]>(
			notificationsKey,
			(previous) =>
				previous?.map((item) =>
					item.id === id ? { ...item, read: true } : item,
				),
		);
		const call =
			role === "vendor"
				? api.vendor.readNotification
				: role === "business"
					? api.business.readNotification
					: api.broker.readNotification;
		void call(id)
			.catch(() => undefined)
			.finally(() =>
				queryClient.invalidateQueries({ queryKey: notificationsKey }),
			);
	}

	function markAllRead() {
		queryClient.setQueryData<ShellNotification[]>(
			notificationsKey,
			(previous) => previous?.map((item) => ({ ...item, read: true })),
		);
		const call =
			role === "vendor"
				? api.vendor.readAllNotifications
				: role === "business"
					? api.business.readAllNotifications
					: api.broker.readAllNotifications;
		void call()
			.catch(() => undefined)
			.finally(() =>
				queryClient.invalidateQueries({ queryKey: notificationsKey }),
			);
	}

	// Settings replaces the old standalone profile page, and only exists for the
	// roles that actually have one.
	const settingsPath =
		role === "vendor"
			? "/vendor/settings"
			: role === "broker"
				? "/broker/settings"
				: role === "business"
					? "/business/settings"
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
					/* Above the wizard's own sticky bar (z-20): the notification
					   and account panels hang from this row, and a bar that outranks
					   it would cut them off. Still under the mobile sidebar (z-40). */
					className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2 sm:gap-3 sm:px-6 sm:py-4"
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
										role="dialog"
										aria-label="Notifications"
										className="absolute right-0 top-full z-50 mt-2 w-[min(30rem,calc(100vw-3rem))] overflow-hidden rounded-xl border border-border bg-white shadow-xl"
									>
										<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
											<span className="flex items-center gap-2">
												<span className="text-sm font-semibold text-foreground">
													Notifications
												</span>
												{unreadCount > 0 ? (
													<span className="rounded-md bg-emerald-700 px-2 py-0.5 text-sm font-semibold text-white">
														{unreadCount} unread
													</span>
												) : null}
											</span>
											{unreadCount > 0 ? (
												<button
													type="button"
													onClick={markAllRead}
													className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-emerald-700 outline-none transition-colors hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-ring"
												>
													<FontAwesomeIcon
														icon={faCheck}
														className="size-3.5"
														aria-hidden
													/>
													Mark all as read
												</button>
											) : null}
										</div>

										{notificationsQuery.isPending ? (
											<div className="space-y-3 p-3">
												{Array.from({ length: 3 }).map((_, i) => (
													<ShimmerBlock key={i} className="h-14 w-full" />
												))}
											</div>
										) : notificationsQuery.isError ? (
											<div className="px-6 py-8 text-center">
												<p className="text-sm font-semibold text-foreground">
													The feed did not load
												</p>
												<p className="mt-1 text-sm text-muted-foreground">
													The notifications endpoint did not answer.
												</p>
												<button
													type="button"
													onClick={() => void notificationsQuery.refetch()}
													className="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
												>
													Try again
												</button>
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
											<ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
												{notifications.map((item) => {
													const content = (
														<span className="flex items-start gap-2.5">
															<span
																aria-hidden="true"
																className={cn(
																	"mt-1.5 size-2 shrink-0 rounded-full",
																	item.read ? "bg-border" : "bg-emerald-700",
																)}
															/>
															<span className="min-w-0 flex-1">
																<span
																	className={cn(
																		"block text-sm text-foreground",
																		item.read ? "font-medium" : "font-semibold",
																	)}
																>
																	{item.title}
																</span>
																{item.body ? (
																	<span className="mt-0.5 line-clamp-3 block text-sm leading-6 text-muted-foreground">
																		{item.body}
																	</span>
																) : null}
																<span className="mt-1 flex items-center gap-3">
																	<span className="text-sm text-muted-foreground">
																		{relativeTime(item.createdAt)}
																	</span>
																	{!item.read ? (
																		<span className="text-sm font-semibold text-emerald-700">
																			Unread
																		</span>
																	) : null}
																</span>
															</span>
														</span>
													);
													const rowClass =
														"block w-full p-3 text-left no-underline transition-colors hover:bg-muted/50";

													// Opening an item is what reads it: the row marks
													// itself read and follows its link.
													return (
														<li key={item.id}>
															{item.link ? (
																<a
																	href={item.link}
																	onClick={() => {
																		markRead(item.id);
																		closeNotifMenu();
																	}}
																	className={rowClass}
																>
																	{content}
																</a>
															) : (
																<button
																	type="button"
																	onClick={() => markRead(item.id)}
																	className={rowClass}
																>
																	{content}
																</button>
															)}
														</li>
													);
												})}
											</ul>
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
								{/* The person, then the organization they are acting as: a
								    shared screen has to say which entity the reader is in.
								    An account with no organization (an administrator) shows
								    the name alone rather than repeating it. */}
								<span className="hidden min-w-0 flex-col text-left sm:flex">
									<span className="max-w-40 truncate text-base font-medium leading-tight text-foreground">
										{name || "Pengguna"}
									</span>
									{user?.companyName &&
									user.companyName !== (name || "Pengguna") ? (
										<span className="max-w-40 truncate text-sm leading-tight text-muted-foreground">
											{user.companyName}
										</span>
									) : null}
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
												icon={faGear}
												className="size-4 shrink-0"
											/>
											Settings
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

				<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-0 pb-16 sm:px-6 sm:pb-20">
					<div className="flex flex-col pt-6 sm:pt-8">{children}</div>
				</div>
			</main>
		</div>
	);
}
