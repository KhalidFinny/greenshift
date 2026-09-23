import { cn } from "../lib/utils";

export function ShimmerBlock({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-lg bg-foreground/10",
				className,
			)}
		>
			<div
				aria-hidden="true"
				className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"
			/>
		</div>
	);
}

export function ContentSkeleton() {
	return (
		<div className="space-y-6">
			<ShimmerBlock className="h-10 w-64" />
			<div className="space-y-4">
				<ShimmerBlock className="h-28 w-full" />
				<ShimmerBlock className="h-28 w-full" />
				<ShimmerBlock className="h-28 w-full" />
			</div>
		</div>
	);
}
