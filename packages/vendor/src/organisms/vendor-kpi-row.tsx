import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent, ShimmerBlock } from "@greenshift/ui";

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
	/** Data still in flight: same cards, shimmering leaves. */
	loading?: boolean;
}

export function VendorKpiRow({ items, loading = false }: VendorKpiRowProps) {
	// One frame, two leaf states: the card markup below is shared, so the
	// skeleton cannot drift from the loaded layout.
	const rows: (KpiItem | null)[] = loading
		? Array.from({ length: 4 }, () => null)
		: items;

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{rows.map((item, i) => (
				<Card key={item?.label ?? i}>
					<CardContent className="space-y-6">
						<div className="flex items-start justify-between gap-4">
							{item ? (
								<p className="text-base text-muted-foreground">{item.label}</p>
							) : (
								<ShimmerBlock className="h-5 w-32" />
							)}
							{item ? (
								<div
									className={`flex size-10 shrink-0 items-center justify-center rounded-full ${item.iconBg} ${item.iconColor}`}
								>
									<FontAwesomeIcon icon={item.icon} className="text-base" />
								</div>
							) : (
								<ShimmerBlock className="size-10 shrink-0 rounded-full" />
							)}
						</div>
						<div>
							{item ? (
								<p className="text-4xl font-semibold leading-none tracking-tight tabular-nums">
									{item.value}
								</p>
							) : (
								<ShimmerBlock className="h-9 w-20" />
							)}
							{item ? (
								<p className="mt-3 text-base text-muted-foreground">
									{item.sub}
								</p>
							) : (
								<ShimmerBlock className="mt-3 h-5 w-40" />
							)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
