import type { GlobeFocusTarget, NewsCard, NewsPayload } from '$lib/types/news';

type NewsFeedStateOptions = {
	maxWindowMs?: number;
	initialPollingMs?: number;
	feedPageSize?: number;
	endpointPath?: string;
};

const DEFAULT_MAX_WINDOW_MS = 48 * 60 * 60 * 1000;
const DEFAULT_POLLING_MS = 60_000;
const DEFAULT_FEED_PAGE_SIZE = 10;

export class NewsFeedState {
	feed = $state<NewsCard[]>([]);
	lastPolledAt = $state('');
	loading = $state(false);
	error = $state('');
	pollingMs = $state(DEFAULT_POLLING_MS);
	totalItems = $state(0);
	selectedMarkerId = $state<string | null>(null);
	selectedNewsId = $state<number | null>(null);
	newsFocusTarget = $state<GlobeFocusTarget | null>(null);
	minPublishedIso = $state<string | null>(null);
	maxPublishedIso = $state<string | null>(null);
	windowStartMs = $state<number | null>(null);
	windowEndMs = $state<number | null>(null);
	feedPage = $state(1);
	isWindowPinned = $state(false);

	readonly maxWindowMs: number;
	readonly feedPageSize: number;
	readonly endpointPath: string;

	intervalId: number | null = null;

	constructor(options: NewsFeedStateOptions = {}) {
		this.maxWindowMs = options.maxWindowMs ?? DEFAULT_MAX_WINDOW_MS;
		this.pollingMs = options.initialPollingMs ?? DEFAULT_POLLING_MS;
		this.feedPageSize = options.feedPageSize ?? DEFAULT_FEED_PAGE_SIZE;
		this.endpointPath = options.endpointPath ?? '/api/news';
	}

	async fetchNews() {
		this.loading = true;
		this.error = '';

		try {
			const requestUrl = new URL(this.endpointPath, window.location.origin);
			if (this.isWindowPinned && this.windowStartMs !== null) {
				requestUrl.searchParams.set('start', new Date(this.windowStartMs).toISOString());
			}
			if (this.isWindowPinned && this.windowEndMs !== null) {
				requestUrl.searchParams.set('end', new Date(this.windowEndMs).toISOString());
			}

			const response = await fetch(requestUrl.toString());
			if (!response.ok) {
				throw new Error(`Failed to poll news feed: ${response.status}`);
			}

			const payload = (await response.json()) as NewsPayload;
			if (payload.error) {
				throw new Error(payload.error);
			}

			this.feed = payload.items;
			this.lastPolledAt = payload.polled_at;
			this.totalItems = payload.total_items;
			this.minPublishedIso = payload.min_published_time;
			this.maxPublishedIso = payload.max_published_time;

			const minBoundMs = payload.min_published_time ? new Date(payload.min_published_time).getTime() : null;
			const maxBoundMs = payload.max_published_time ? new Date(payload.max_published_time).getTime() : null;
			const payloadStartMs = payload.window_start ? new Date(payload.window_start).getTime() : null;
			const payloadEndMs = payload.window_end ? new Date(payload.window_end).getTime() : null;

			if (!this.isWindowPinned) {
				if (maxBoundMs !== null) {
					const startFloor = minBoundMs ?? maxBoundMs;
					const liveWindowMs = Math.min(this.maxWindowMs, Math.max(0, maxBoundMs - startFloor));
					this.windowEndMs = maxBoundMs;
					this.windowStartMs = Math.max(startFloor, maxBoundMs - liveWindowMs);
				} else if (payloadStartMs !== null && payloadEndMs !== null) {
					this.windowStartMs = payloadStartMs;
					this.windowEndMs = payloadEndMs;
				}
			} else if (minBoundMs !== null && maxBoundMs !== null) {
				const currentStart = this.windowStartMs ?? payloadStartMs;
				const currentEnd = this.windowEndMs ?? payloadEndMs;
				if (currentStart !== null && currentEnd !== null) {
					const windowMs = Math.min(this.maxWindowMs, Math.max(0, currentEnd - currentStart));
					const latestStart = Math.max(minBoundMs, maxBoundMs - windowMs);
					const boundedStart = Math.min(Math.max(currentStart, minBoundMs), latestStart);
					this.windowStartMs = boundedStart;
					this.windowEndMs = Math.min(maxBoundMs, boundedStart + windowMs);
				}
			}

			if (this.selectedNewsId !== null && !payload.items.some((item) => item.id === this.selectedNewsId)) {
				this.selectedNewsId = null;
			}
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown poll error';
		} finally {
			this.loading = false;
		}
	}

	resetPollingTimer() {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
		}

		this.intervalId = null;
		if (this.selectedMarkerId) {
			return;
		}

		this.intervalId = window.setInterval(() => {
			void this.fetchNews();
		}, this.pollingMs);
	}

	setPollingMs(nextValue: number) {
		if (Number.isNaN(nextValue)) {
			return;
		}

		this.pollingMs = nextValue;
		this.resetPollingTimer();
	}

	setPollingMsFromEvent(event: Event) {
		const nextValue = Number((event.currentTarget as HTMLSelectElement).value);
		this.setPollingMs(nextValue);
	}

	updateTimeWindowStart(nextStart: number) {
		if (this.minPublishedIso === null || this.maxPublishedIso === null) {
			return;
		}

		const minMs = new Date(this.minPublishedIso).getTime();
		const maxMs = new Date(this.maxPublishedIso).getTime();
		const windowMs = Math.min(this.maxWindowMs, Math.max(0, maxMs - minMs));
		const latestStart = Math.max(minMs, maxMs - windowMs);
		const boundedStart = Math.min(Math.max(nextStart, minMs), latestStart);
		const boundedEnd = boundedStart + windowMs;

		this.isWindowPinned = true;
		this.windowEndMs = boundedEnd;
		this.windowStartMs = boundedStart;
		void this.fetchNews();
	}

	setSelectedMarkerId(markerId: string | null) {
		this.selectedMarkerId = markerId;
		if (markerId !== null) {
			this.selectedNewsId = null;
			this.newsFocusTarget = null;
		}
		this.resetPollingTimer();
	}

	toggleNewsSelection(newsId: number, focusResolver: (item: NewsCard) => GlobeFocusTarget | null) {
		if (this.selectedNewsId === newsId) {
			this.selectedNewsId = null;
			this.newsFocusTarget = null;
			return;
		}

		this.selectedNewsId = newsId;
		this.selectedMarkerId = null;
		const selectedItem = this.feed.find((item) => item.id === newsId);
		this.newsFocusTarget = selectedItem ? focusResolver(selectedItem) : null;
	}

	gotoPrevFeedPage() {
		if (this.feedPage > 1) {
			this.feedPage -= 1;
		}
	}

	gotoNextFeedPage(totalFeedPages: number) {
		if (this.feedPage < totalFeedPages) {
			this.feedPage += 1;
		}
	}

	clampFeedPage(totalFeedPages: number) {
		const maxPage = Math.max(1, totalFeedPages);
		if (this.feedPage > maxPage) {
			this.feedPage = maxPage;
		}
		if (this.feedPage < 1) {
			this.feedPage = 1;
		}
	}

	resetFeedPage() {
		this.feedPage = 1;
	}

	start() {
		void this.fetchNews();
		this.resetPollingTimer();
	}

	stop() {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
		}
		this.intervalId = null;
	}
}
