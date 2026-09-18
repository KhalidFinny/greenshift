import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent } from "@greenshift/ui";

interface KpiItem {
	label: string;
	value: string | number;
	sub: string;
	icon: IconDefinition;
	iconBg: string;
	iconColor: string;
}

interface VendorKpiRowProps {
	items: KpiItem[];
}

export function VendorKpiRow({ items }: VendorKpiRowProps) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{items.map((item) => (
				<Card key={item.label}>
					<CardContent className="flex items-center justify-between p-6">
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								{item.label}
							</p>
							<h3 className="mt-2 text-3xl font-bold">{item.value}</h3>
							<p className="mt-1 text-xs text-muted-foreground">{item.sub}</p>
						</div>
						<div
							className={`flex size-12 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}
						>
							<FontAwesomeIcon icon={item.icon} className="text-xl" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
