/** Format a date the way the design shows it: DD/MM/YYYY. */
export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
}

/** Long form for article pages: 17 July 2026. */
export function formatDateLong(date: Date): string {
	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(date);
}
