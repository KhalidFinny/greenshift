/** A timestamp as a feed reads it ("2 hours ago"). Shared by the role surfaces,
 * so the same event is not dated two different ways in two packages. */
export function relativeTime(iso: string, now = Date.now()): string {
	const elapsed = now - Date.parse(iso);
	if (!Number.isFinite(elapsed) || elapsed < 0) return "just now";
	const minutes = Math.floor(elapsed / 60_000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
	const days = Math.floor(hours / 24);
	if (days === 1) return "1 day ago";
	if (days < 30) return `${days} days ago`;
	const months = Math.floor(days / 30);
	if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
	const years = Math.floor(months / 12);
	return `${years} year${years === 1 ? "" : "s"} ago`;
}
