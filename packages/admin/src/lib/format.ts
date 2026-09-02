const dateTime = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
	timeStyle: "short",
});

export function formatDateTime(value: string | null | undefined): string {
	if (!value) return "—";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "—" : dateTime.format(date);
}
