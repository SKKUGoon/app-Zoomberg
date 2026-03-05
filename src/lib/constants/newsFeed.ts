export const DEFAULT_POLLING_MS = 60_000;
export const DEFAULT_FEED_PAGE_SIZE = 10;

export const POLLING_OPTIONS = [
	{ label: '1 minute', value: 60_000 },
	{ label: '5 minutes', value: 300_000 },
	{ label: '10 minutes', value: 600_000 }
] as const;
