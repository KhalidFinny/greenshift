import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	EmptyState,
	PaginationBar,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	usePagedRows,
} from "@greenshift/ui";
import type { VendorNotification } from "../lib/types";
import { useVendorData } from "../lib/use-vendor-data";
import { NotificationItemCard } from "../organisms/notification-item-card";

function NotificationList({
	notifications,
	emptyTitle,
	emptyDescription,
	onMarkRead,
}: {
	notifications: VendorNotification[];
	emptyTitle: string;
	emptyDescription: string;
	onMarkRead?: (id: string) => void;
}) {
	const paged = usePagedRows(notifications);

	if (notifications.length === 0) {
		return (
			<EmptyState
				icon={<FontAwesomeIcon icon={faBell} />}
				title={emptyTitle}
				description={emptyDescription}
			/>
		);
	}

	return (
		<div className="space-y-3">
			{paged.pageRows.map((n) => (
				<NotificationItemCard
					key={n.id}
					notification={n}
					onMarkRead={onMarkRead}
				/>
			))}
			<PaginationBar
				label="Notifications"
				pageIndex={paged.pageIndex}
				pageSize={paged.pageSize}
				pageCount={paged.pageCount}
				total={paged.total}
				onPageIndexChange={paged.setPageIndex}
				onPageSizeChange={paged.setPageSize}
			/>
		</div>
	);
}

export function VendorNotificationsPage() {
	const { notifications, markNotificationRead } = useVendorData();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Vendor Notification Center</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Real-time updates regarding tender standings, price ranking revisions,
					structured negotiations, and corporate verification.
				</p>
			</div>

			<Tabs defaultValue="all">
				<TabsList className="flex w-full overflow-x-auto *:shrink-0 *:whitespace-nowrap sm:grid sm:grid-cols-6">
					<TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
					<TabsTrigger value="unread">
						Unread ({notifications.filter((n) => !n.isRead).length})
					</TabsTrigger>
					<TabsTrigger value="tenders">Tenders</TabsTrigger>
					<TabsTrigger value="projects">Opportunities</TabsTrigger>
					<TabsTrigger value="negotiation">Negotiations</TabsTrigger>
					<TabsTrigger value="system">System</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="mt-6">
					<NotificationList
						notifications={notifications}
						emptyTitle="No notifications yet"
						emptyDescription="Tender standings, negotiation requests, and verification updates are delivered here as they happen."
						onMarkRead={markNotificationRead}
					/>
				</TabsContent>

				<TabsContent value="unread" className="mt-6">
					<NotificationList
						notifications={notifications.filter((n) => !n.isRead)}
						emptyTitle="You are all caught up"
						emptyDescription="No unread notifications. Everything you have read stays in the All tab."
						onMarkRead={markNotificationRead}
					/>
				</TabsContent>

				<TabsContent value="tenders" className="mt-6">
					<NotificationList
						notifications={notifications.filter(
							(n) => n.category === "Tenders",
						)}
						emptyTitle="No tender notifications"
						emptyDescription="Ranking changes and deadline reminders for tenders you have joined appear here."
						onMarkRead={markNotificationRead}
					/>
				</TabsContent>

				<TabsContent value="projects" className="mt-6">
					<NotificationList
						notifications={notifications.filter(
							(n) => n.category === "Projects",
						)}
						emptyTitle="No opportunity notifications"
						emptyDescription="Updates on open opportunities that match your profile appear here."
						onMarkRead={markNotificationRead}
					/>
				</TabsContent>

				<TabsContent value="negotiation" className="mt-6">
					<NotificationList
						notifications={notifications.filter(
							(n) => n.category === "Negotiation",
						)}
						emptyTitle="No negotiation notifications"
						emptyDescription="Client revision requests and negotiation updates appear here."
						onMarkRead={markNotificationRead}
					/>
				</TabsContent>

				<TabsContent value="system" className="mt-6">
					<NotificationList
						notifications={notifications.filter(
							(n) => n.category === "System" || n.category === "Verification",
						)}
						emptyTitle="No system notifications"
						emptyDescription="Account, verification, and platform messages appear here."
						onMarkRead={markNotificationRead}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
