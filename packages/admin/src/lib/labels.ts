/**
 * Presentation labels for backend statuses. Kept free of data so pages can
 * import them without pulling fixtures along.
 */
export const BLUEPRINT_META: Record<
	string,
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline";
	}
> = {
	published: { label: "Verified", variant: "default" },
	validated: { label: "Validated", variant: "secondary" },
	rejected: { label: "Rejected", variant: "destructive" },
	audit: { label: "In Audit", variant: "outline" },
	draft: { label: "Draft", variant: "outline" },
};
