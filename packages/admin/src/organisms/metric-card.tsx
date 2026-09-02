import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent } from "@greenshift/ui";

interface MetricCardProps {
	label: string;
	value: string;
	sub: string;
	icon: IconDefinition;
	subTone?: "muted" | "positive" | "destructive";
}

const SUB_TONE_CLASS: Record<NonNullable<MetricCardProps["subTone"]>, string> = {
	muted: "text-muted-foreground",
	positive: "text-primary",
	destructive: "text-destructive",
};

export function MetricCard({
	label,
	value,
	sub,
	icon,
	subTone = "muted",
}: MetricCardProps) {
	return (
		<Card>
			<CardContent className="space-y-6">
				<div className="flex items-start justify-between gap-4">
					<p className="text-base text-muted-foreground">{label}</p>
					<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/70">
						<FontAwesomeIcon icon={icon} className="text-base" />
					</div>
				</div>
				<div>
					<p className="text-4xl font-semibold leading-none tracking-tight tabular-nums">
						{value}
					</p>
					<p className={`mt-3 text-base ${SUB_TONE_CLASS[subTone]}`}>{sub}</p>
				</div>
			</CardContent>
		</Card>
	);
}
