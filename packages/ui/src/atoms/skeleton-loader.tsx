import { cn } from "../lib/utils";

/** One shimmering placeholder block. Exported so route-level skeletons mirror
 * their real page layout instead of a generic stack. */
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

/** Content-area skeleton shown while a route loads: the app shell (sidebar +
 * header) stays rendered, only the content shimmers. */
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
