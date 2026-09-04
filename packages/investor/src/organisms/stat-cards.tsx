import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent, cn } from "@greenshift/ui";

export type StatTone = "default" | "positive" | "destructive";

export interface StatItem {
	label: string;
	value: string;
	icon: IconDefinition;
	sub?: string;
	tone?: StatTone;
}

const VALUE_TONE: Record<StatTone, string> = {
	default: "text-foreground",
	positive: "text-primary",
	destructive: "text-destructive",
};

interface StatCardsProps {
	items: StatItem[];
}

/**
 * Right-column companion to a wide chart: each stat gets its own Card and
 * the cards share the column height evenly (flex-1), so the column reads as
 * three big, balanced numbers instead of one narrow strip.
 */
export function StatCards({ items }: StatCardsProps) {
	return (
		<div className="flex h-full flex-col gap-4">
			{items.map((item) => (
				<Card key={item.label} className="flex-1">
					<CardContent className="flex h-full flex-col justify-center space-y-3">
						<div className="flex items-start justify-between gap-4">
							<p className="text-base text-muted-foreground">{item.label}</p>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/70">
								<FontAwesomeIcon icon={item.icon} className="text-base" />
							</div>
						</div>
						<p
							className={cn(
								"text-3xl font-semibold leading-none tracking-tight tabular-nums",
								VALUE_TONE[item.tone ?? "default"],
							)}
						>
							{item.value}
						</p>
						{item.sub ? (
							<p className="text-base text-muted-foreground">{item.sub}</p>
						) : null}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
