import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent, ShimmerBlock } from "@greenshift/ui";

interface MetricCardProps {
	label: string;
	value: string;
	sub: string;
	icon: IconDefinition;
	subTone?: "muted" | "positive" | "destructive";
	/** Data still in flight: same card, shimmering value and sub-line. */
	loading?: boolean;
}

const SUB_TONE_CLASS: Record<
	NonNullable<MetricCardProps["subTone"]>,
	string
> = {
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
	loading = false,
}: MetricCardProps) {
	// One frame, two leaf states: the label and icon are static, so only the fetched numbers shimmer.
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
					{loading ? (
						<ShimmerBlock className="h-9 w-24" />
					) : (
						<p className="text-4xl font-semibold leading-none tracking-tight tabular-nums">
							{value}
						</p>
					)}
					{loading ? (
						<ShimmerBlock className="mt-3 h-5 w-40" />
					) : (
						<p className={`mt-3 text-base ${SUB_TONE_CLASS[subTone]}`}>{sub}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
