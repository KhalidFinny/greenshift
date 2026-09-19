import {
	faFileSignature,
	faGavel,
	faHandshake,
	faInfoCircle,
	faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Button, Card, CardContent } from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import type { VendorNotification } from "../lib/types";

interface NotificationItemCardProps {
	notification: VendorNotification;
	onMarkRead?: (id: string) => void;
}

function getNotificationIcon(category: VendorNotification["category"]) {
	switch (category) {
		case "Negotiation":
			return <FontAwesomeIcon icon={faHandshake} className="text-blue-600" />;
		case "Tenders":
			return <FontAwesomeIcon icon={faGavel} className="text-emerald-700" />;
		case "Projects":
			return (
				<FontAwesomeIcon icon={faFileSignature} className="text-purple-600" />
			);
		case "Verification":
			return <FontAwesomeIcon icon={faShieldAlt} className="text-amber-700" />;
		default:
			return (
				<FontAwesomeIcon
					icon={faInfoCircle}
					className="text-muted-foreground"
				/>
			);
	}
}

export function NotificationItemCard({
	notification,
	onMarkRead,
}: NotificationItemCardProps) {
	return (
		<Card
			className={`transition-all ${
				!notification.isRead
					? "border-emerald-500 bg-emerald-50/30 font-medium"
					: ""
			}`}
		>
			<CardContent className="flex items-start justify-between gap-4 p-4 text-sm">
				<div className="flex items-start gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-base">
						{getNotificationIcon(notification.category)}
					</div>
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<Badge variant="outline" className="text-sm">
								{notification.category}
							</Badge>
							<span className="text-sm text-muted-foreground">
								{notification.timestamp}
							</span>
						</div>
						<h4 className="text-sm font-semibold text-foreground">
							{notification.title}
						</h4>
						<p className="text-muted-foreground">{notification.message}</p>
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					{!notification.isRead && onMarkRead && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => onMarkRead(notification.id)}
							className="text-sm text-emerald-700 hover:text-emerald-800"
						>
							Mark as Read
						</Button>
					)}
					<Link to={notification.linkUrl}>
						<Button size="sm" variant="outline" className="text-sm">
							Open Page
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
