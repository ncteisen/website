/** Calendar dates stay on their named day; timestamps use UTC on every build host. */
export function formatDate(value: string): string {
	const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z`
		: /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value) ? `${value}Z` : value;
	const date = new Date(timestamp);
	if (!Number.isFinite(date.getTime())) return 'Unknown date';
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** Strava's local timestamp describes the activity's calendar day, without a zone conversion. */
export function formatActivityDate(activity: { start_date: string; start_date_local?: string }): string {
	return formatDate(activity.start_date_local?.slice(0, 10) || activity.start_date);
}
