import { cn } from "@greenshift/ui";

// Rating on a fixed 0–5 scale: >=4.5 strong, >=4.0 middling, below destructive.
export function RatingBar({
	rating,
	className,
}: {
	rating: number;
	className?: string;
}) {
	const barClass =
		rating >= 4.5
			? "bg-primary"
			: rating >= 4
				? "bg-primary/60"
				: "bg-destructive";
	return (
		<div
			role="img"
			aria-label={`Rating ${rating.toFixed(1)} out of 5`}
			className={cn(
				"h-2 w-full overflow-hidden rounded-full bg-muted",
				className,
			)}
		>
			<div
				className={cn("h-full rounded-full", barClass)}
				style={{
					width: `${Math.min(Math.max((rating / 5) * 100, 0), 100)}%`,
				}}
			/>
		</div>
	);
}
