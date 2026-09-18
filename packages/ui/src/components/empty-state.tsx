export function EmptyState({
	title = "Nothing here yet",
	description,
}: {
	title?: string;
	description?: string;
}) {
	return (
		<div className="flex flex-col items-start gap-1 rounded-lg border border-dashed border-border p-8">
			<h2 className="text-lg font-semibold">{title}</h2>
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}
		</div>
	);
}
