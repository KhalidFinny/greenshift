import type { ReactNode } from "react";
import { cn } from "../lib/utils";

interface EmptyStateProps {
	icon?: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
	tone?: "neutral" | "error";
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	tone = "neutral",
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center">
			{icon ? (
				<div
					className={cn(
						"flex size-12 items-center justify-center rounded-full",
						tone === "error"
							? "bg-destructive/10 text-destructive"
							: "bg-muted text-muted-foreground",
					)}
				>
					{icon}
				</div>
			) : null}
			<div className="space-y-1">
				<h2 className="text-lg font-semibold text-foreground">{title}</h2>
				{description ? (
					<p className="max-w-md text-sm text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>
			{action}
		</div>
	);
}
