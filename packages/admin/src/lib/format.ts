const dateTime = new Intl.DateTimeFormat("en-US", {
	dateStyle: "medium",
	timeStyle: "short",
});

const monthName = new Intl.DateTimeFormat("en-US", {
	month: "short",
	timeZone: "UTC",
});

export function formatDateTime(value: string | null | undefined): string {
	if (!value) return "-";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "-" : dateTime.format(date);
}

/**
 * Chart axis label for a `YYYY-MM` key from the analytics series. Read as UTC,
 * which is how the backend groups the months.
 */
export function formatMonth(month: string): string {
	const date = new Date(`${month}-01T00:00:00Z`);
	return Number.isNaN(date.getTime()) ? month : monthName.format(date);
}
