import { Tabs, TabsContent, TabsList, TabsTrigger } from "@greenshift/ui";
import { useVendorData } from "../lib/use-vendor-data";
import { NotificationItemCard } from "../organisms/notification-item-card";

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
				<TabsList className="grid w-full grid-cols-6">
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
					<div className="space-y-3">
						{notifications.map((n) => (
							<NotificationItemCard
								key={n.id}
								notification={n}
								onMarkRead={markNotificationRead}
							/>
						))}
					</div>
				</TabsContent>

				<TabsContent value="unread" className="mt-6">
					<div className="space-y-3">
						{notifications
							.filter((n) => !n.isRead)
							.map((n) => (
								<NotificationItemCard
									key={n.id}
									notification={n}
									onMarkRead={markNotificationRead}
								/>
							))}
					</div>
				</TabsContent>

				<TabsContent value="tenders" className="mt-6">
					<div className="space-y-3">
						{notifications
							.filter((n) => n.category === "Tenders")
							.map((n) => (
								<NotificationItemCard key={n.id} notification={n} />
							))}
					</div>
				</TabsContent>

				<TabsContent value="projects" className="mt-6">
					<div className="space-y-3">
						{notifications
							.filter((n) => n.category === "Projects")
							.map((n) => (
								<NotificationItemCard key={n.id} notification={n} />
							))}
					</div>
				</TabsContent>

				<TabsContent value="negotiation" className="mt-6">
					<div className="space-y-3">
						{notifications
							.filter((n) => n.category === "Negotiation")
							.map((n) => (
								<NotificationItemCard key={n.id} notification={n} />
							))}
					</div>
				</TabsContent>

				<TabsContent value="system" className="mt-6">
					<div className="space-y-3">
						{notifications
							.filter(
								(n) => n.category === "System" || n.category === "Verification",
							)
							.map((n) => (
								<NotificationItemCard key={n.id} notification={n} />
							))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
