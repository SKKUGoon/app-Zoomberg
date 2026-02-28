<script lang="ts">
	import { onMount } from 'svelte';
	import NewsFeedCard from '$lib/components/NewsFeedCard.svelte';
import OpenWorldGlobe from '$lib/components/OpenWorldGlobe.svelte';
import AreaWordCloud from '$lib/components/AreaWordCloud.svelte';

	type NewsPayload = {
		items: NewsCard[];
		polled_at: string;
		page: number;
		page_size: number;
		total_items: number;
		total_pages: number;
		error?: string;
	};

	type ThemeSegment = {
		color: string;
		weight: number;
		label: string;
	};

	type MapMarker = {
		id: string;
		latitude: number;
		longitude: number;
		title: string;
		detail: string;
		total: number;
		segments: ThemeSegment[];
		wordCloud: Array<{ word: string; weight: number }>;
		articleIds: string[];
	};

	type NewsCard = {
		id: string;
		rss_item_id: string;
		source: string;
		source_title: string;
		source_link: string;
		summary: string | null;
		time_published: string;
		city_id: string | null;
		city: string | null;
		country: string | null;
		latitude: number | null;
		longitude: number | null;
		keyword_theme_upper: string;
		keyword_theme_lower: string;
		keyword_action_upper: string;
		keyword_action_lower: string;
		created_at: string;
		updated_at: string;
	};

	let feed = $state<NewsCard[]>([]);
	let lastPolledAt = $state('');
	let loading = $state(false);
	let error = $state('');
	let pollingMs = $state(60_000);
	let intervalId: number | null = null;
	let totalItems = $state(0);
	let selectedMarkerId = $state<string | null>(null);
	let feedPage = $state(1);
	const FEED_PAGE_SIZE = 10;

	const pollingOptions = [
		{ label: '1 minute', value: 60_000 },
		{ label: '5 minutes', value: 300_000 },
		{ label: '10 minutes', value: 600_000 }
	] as const;

	const themePalette = ['#ff7f50', '#53d2dc', '#f7a437', '#8ddf77', '#f67dc0', '#8ea4ff', '#ffd166'];
	const stopWords = new Set([
		'a',
		'an',
		'the',
		'and',
		'or',
		'but',
		'if',
		'then',
		'else',
		'when',
		'where',
		'who',
		'whom',
		'whose',
		'which',
		'what',
		'why',
		'how',
		'did',
		'does',
		'do',
		'done',
		'is',
		'are',
		'was',
		'were',
		'be',
		'been',
		'being',
		'am',
		'to',
		'of',
		'in',
		'on',
		'at',
		'by',
		'as',
		'it',
		'its',
		'they',
		'them',
		'their',
		'you',
		'your',
		'we',
		'our',
		'he',
		'she',
		'him',
		'her',
		'i',
		'me',
		'my',
		'for',
		'with',
		'from',
		'that',
		'this',
		'these',
		'those',
		'into',
		'over',
		'under',
		'after',
		'before',
		'against',
		'near',
		'out',
		'up',
		'down',
		'not',
		'no',
		'yes',
		'has',
		'have',
		'had',
		'will',
		'would',
		'can',
		'could',
		'should',
		'may',
		'might',
		'must',
		'about',
		'across',
		'via',
		'news',
		'market',
		'markets',
		'update',
		'says',
		'said',
		'report',
		'reported',
		'bloomberg',
		'coindesk',
	]);

	const tokenize = (value: string | null | undefined): string[] => {
		if (!value) {
			return [];
		}

		return value
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, ' ')
			.split(/\s+/)
			.filter((word) => word.length >= 3 && !stopWords.has(word));
	};

	const colorForTheme = (theme: string) => {
		let hash = 0;
		for (let i = 0; i < theme.length; i += 1) {
			hash = (hash * 31 + theme.charCodeAt(i)) >>> 0;
		}

		return themePalette[hash % themePalette.length];
	};

	const fetchNews = async () => {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/news');
			if (!response.ok) {
				throw new Error(`Failed to poll news feed: ${response.status}`);
			}

			const payload = (await response.json()) as NewsPayload;
			if (payload.error) {
				throw new Error(payload.error);
			}

			feed = payload.items;
			lastPolledAt = payload.polled_at;
			totalItems = payload.total_items;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown poll error';
		} finally {
			loading = false;
		}
	};

	const resetPollingTimer = () => {
		if (intervalId !== null) {
			window.clearInterval(intervalId);
		}

		intervalId = null;
		if (selectedMarkerId) {
			return;
		}

		intervalId = window.setInterval(() => {
			void fetchNews();
		}, pollingMs);
	};

	const onPollingChange = (event: Event) => {
		const nextValue = Number((event.currentTarget as HTMLSelectElement).value);
		if (!Number.isNaN(nextValue)) {
			pollingMs = nextValue;
			resetPollingTimer();
		}
	};

	onMount(() => {
		void fetchNews();
		resetPollingTimer();

		return () => {
			if (intervalId !== null) {
				window.clearInterval(intervalId);
			}
		};
	});

	const formatTime = (isoDate: string) => {
		const date = new Date(isoDate);
		return new Intl.DateTimeFormat('en', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			month: 'short',
			day: '2-digit'
		}).format(date);
	};

	const formatLocation = (city: string | null, country: string | null) => {
		if (city && country) {
			return `${city}, ${country}`;
		}

		if (city) {
			return city;
		}

		if (country) {
			return country;
		}

		return 'Location unavailable';
	};

const describeThemeMix = (marker: MapMarker) => {
	const parts = marker.segments
		.slice(0, 4)
		.map((segment) => `${segment.label}: ${segment.weight}`)
		.join(' | ');
	return parts.length > 0 ? `Theme mix: ${parts}` : 'Theme mix: n/a';
};

	const getNumericCoords = (item: NewsCard): { lat: number; lon: number } | null => {
		if (item.latitude === null || item.longitude === null) {
			return null;
		}

		const lat = Number(item.latitude);
		const lon = Number(item.longitude);
		if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
			return null;
		}

		return { lat, lon };
	};

	const markerKeyForItem = (item: NewsCard): string | null => {
		const coords = getNumericCoords(item);
		if (!coords) {
			return null;
		}

		return `${coords.lat.toFixed(4)}:${coords.lon.toFixed(4)}`;
	};

	const buildMapMarkers = (items: NewsCard[]): MapMarker[] => {
			const grouped = new Map<
				string,
				{
					latitude: number;
					longitude: number;
					location: string;
					total: number;
					themes: Map<string, number>;
					words: Map<string, number>;
					articleIds: string[];
					latestTime: string;
				}
			>();

			for (const item of items) {
				if (item.latitude === null || item.longitude === null) {
					continue;
				}

				const key = markerKeyForItem(item);
				if (!key) {
					continue;
				}
				const coords = getNumericCoords(item);
				if (!coords) {
					continue;
				}
				const current = grouped.get(key);
				const theme = item.keyword_theme_upper.trim() || 'UNKNOWN';

				if (!current) {
					const themeMap = new Map<string, number>();
					const wordMap = new Map<string, number>();
					themeMap.set(theme, 1);
					for (const word of tokenize(item.summary)) {
						wordMap.set(word, (wordMap.get(word) ?? 0) + 1);
					}
					for (const word of tokenize(item.source_title)) {
						wordMap.set(word, (wordMap.get(word) ?? 0) + 1);
					}
					grouped.set(key, {
						latitude: coords.lat,
						longitude: coords.lon,
						location: formatLocation(item.city, item.country),
						total: 1,
						themes: themeMap,
						words: wordMap,
						articleIds: [item.id],
						latestTime: item.time_published
					});
					continue;
				}

				current.total += 1;
				current.latestTime = item.time_published > current.latestTime ? item.time_published : current.latestTime;
				current.themes.set(theme, (current.themes.get(theme) ?? 0) + 1);
				for (const word of tokenize(item.summary)) {
					current.words.set(word, (current.words.get(word) ?? 0) + 1);
				}
				for (const word of tokenize(item.source_title)) {
					current.words.set(word, (current.words.get(word) ?? 0) + 1);
				}
				current.articleIds.push(item.id);
			}

			const markers: MapMarker[] = [...grouped.entries()]
				.map(([key, group]) => {
					const segments = [...group.themes.entries()]
						.sort((a, b) => b[1] - a[1])
						.map(([theme, weight]) => ({
							label: theme,
							weight,
							color: colorForTheme(theme)
						}));

					const wordCloud = [...group.words.entries()]
						.sort((a, b) => b[1] - a[1])
						.slice(0, 12)
						.map(([word, weight]) => ({ word, weight }));

					return {
						id: key,
						latitude: group.latitude,
						longitude: group.longitude,
						title: group.location,
						detail: `${group.total} article(s) - ${formatTime(group.latestTime)} - ${group.latitude.toFixed(4)}, ${group.longitude.toFixed(4)}`,
						total: group.total,
						segments,
						wordCloud,
						articleIds: group.articleIds
					};
				})
				.sort((a, b) => b.total - a.total);

			return markers;
		};

	const mapMarkers = $derived.by(() => buildMapMarkers(feed));

	const filteredFeed = $derived.by(() => {
		if (!selectedMarkerId) {
			return feed;
		}

		const activeMarker = mapMarkers.find((marker) => marker.id === selectedMarkerId);
		if (!activeMarker) {
			return feed;
		}

		const idSet = new Set(activeMarker.articleIds);
		return feed.filter((item) => idSet.has(item.id));
	});

	const totalFeedPages = $derived.by(() => Math.max(1, Math.ceil(filteredFeed.length / FEED_PAGE_SIZE)));
	const pagedFeed = $derived.by(() => {
		const start = (feedPage - 1) * FEED_PAGE_SIZE;
		return filteredFeed.slice(start, start + FEED_PAGE_SIZE);
	});

	$effect(() => {
		const maxPage = totalFeedPages;
		if (feedPage > maxPage) {
			feedPage = maxPage;
		}
		if (feedPage < 1) {
			feedPage = 1;
		}
	});

	$effect(() => {
		void filteredFeed.length;
		feedPage = 1;
	});

	const selectedMarker = $derived(mapMarkers.find((marker) => marker.id === selectedMarkerId) ?? null);

	const onMarkerOpen = (markerId: string) => {
		selectedMarkerId = markerId;
		resetPollingTimer();
	};

	const onMarkerClose = () => {
		selectedMarkerId = null;
		resetPollingTimer();
	};

	const clearMarkerFilter = () => {
		selectedMarkerId = null;
		resetPollingTimer();
	};

	const gotoPrevFeedPage = () => {
		if (feedPage > 1) {
			feedPage -= 1;
		}
	};

	const gotoNextFeedPage = () => {
		if (feedPage < totalFeedPages) {
			feedPage += 1;
		}
	};

</script>

<section class="map-scene">
	<OpenWorldGlobe
		markers={mapMarkers}
		selectedMarkerId={selectedMarkerId}
		onMarkerOpen={onMarkerOpen}
		onMarkerClose={onMarkerClose}
	/>

	<div class="overlay-grid">
		<div class="sidebar-stack">
			<section class="title-overlay">
				<p class="eyebrow">Globe</p>
				<h1>Global Context and Event Console</h1>
				<p>Showing geolocated market-related news published in the latest 24 hours.</p>
			</section>

			<section class="news-overlay">
				<div class="panel-heading-row">
					<div class="panel-heading">
						<h2>Live News Feed</h2>
						<p>{loading ? 'Polling...' : `Last polled: ${lastPolledAt ? formatTime(lastPolledAt) : 'n/a'}`}</p>
					</div>
					<div class="feed-pagination">
						<button type="button" onclick={gotoPrevFeedPage} disabled={feedPage <= 1} aria-label="Previous feed page">
							Prev
						</button>
						<span>{feedPage}/{totalFeedPages}</span>
						<button
							type="button"
							onclick={gotoNextFeedPage}
							disabled={feedPage >= totalFeedPages}
							aria-label="Next feed page"
						>
							Next
						</button>
					</div>
				</div>

				<div class="controls-row">
					<div class="controls polling-control">
						<label for="polling-select">Auto polling</label>
						<select id="polling-select" value={pollingMs} onchange={onPollingChange}>
							{#each pollingOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					<p class="map-debug">{mapMarkers.length} markers | {feed.length} rows | {totalItems} total</p>
				</div>

				{#if selectedMarker}
					<div class="active-filter">
						<span>Filtered by area: {selectedMarker.title} ({selectedMarker.total} articles)</span>
						<button type="button" onclick={clearMarkerFilter}>Clear filter</button>
					</div>
				{:else}
					<p class="muted filter-hint">Select a globe marker to filter the feed.</p>
				{/if}

				{#if error}
					<p class="error">{error}</p>
				{:else if filteredFeed.length === 0}
					<p class="muted">No cards in the last 24 hours.</p>
				{:else}
					<div class="cards">
						{#each pagedFeed as item}
							<NewsFeedCard
								source={item.source}
								title={item.source_title}
								summary={item.summary}
								timeLabel={formatTime(item.time_published)}
								link={item.source_link}
								locationLabel={formatLocation(item.city, item.country)}
								themeLabel={`${item.keyword_theme_upper} / ${item.keyword_theme_lower}`}
								actionLabel={`${item.keyword_action_upper} / ${item.keyword_action_lower}`}
							/>
						{/each}
					</div>
				{/if}
			</section>

			{#if selectedMarker}
				<section class="area-overlay">
					<div class="panel-heading">
						<h2>{selectedMarker.title}</h2>
						<p>Selected area context and keyword cloud.</p>
					</div>
					<p class="area-detail">{selectedMarker.detail}</p>
					<p class="area-theme">{describeThemeMix(selectedMarker)}</p>
					<AreaWordCloud words={selectedMarker.wordCloud} emptyLabel="No summary terms for this area." />
				</section>
			{/if}
		</div>
	</div>
</section>

<style>
	.map-scene {
		position: relative;
		height: 100vh;
		width: 100%;
	}

	.overlay-grid {
		position: absolute;
		inset: 0;
		display: flex;
		justify-content: flex-end;
		padding: 1rem;
		gap: 0.9rem;
		pointer-events: none;
		z-index: 500;
	}

	.sidebar-stack {
		pointer-events: none;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		width: min(38rem, 47vw);
		max-height: calc(100vh - 2rem);
	}

	.title-overlay,
	.news-overlay,
	.area-overlay {
		pointer-events: auto;
		border: 1px solid #f3f6fb1f;
		backdrop-filter: blur(14px);
		background: linear-gradient(145deg, #0c131bc9, #111a25a8);
		box-shadow: 0 16px 40px #02060c88;
		border-radius: 0.8rem;
	}

	.title-overlay {
		min-height: 5.76rem;
		padding: 0.52rem 0.72rem;
	}

	.eyebrow {
		margin: 0;
		font: 600 0.68rem/1 'IBM Plex Mono', monospace;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #ffb146;
	}

	h1 {
		margin: 0.24rem 0 0.28rem;
		font: 700 clamp(0.92rem, 1.2vw, 1.12rem) / 1.18 'IBM Plex Sans', sans-serif;
		color: #f1f5fa;
	}

	.title-overlay > p:not(.eyebrow) {
		margin: 0;
		color: #b8c4d1;
		font-size: 0.73rem;
		line-height: 1.35;
	}

	.news-overlay {
		display: flex;
		flex-direction: column;
		padding: 0.8rem;
		min-height: 0;
		max-height: min(75vh, 49rem);
	}

	.area-overlay {
		padding: 0.7rem 0.75rem;
	}

	.panel-heading-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.6rem;
	}

	.panel-heading h2 {
		margin: 0;
		font: 600 0.95rem/1.2 'IBM Plex Sans', sans-serif;
		color: #f6fbff;
	}

	.panel-heading p {
		margin: 0.24rem 0 0.55rem;
		font: 500 0.72rem/1 'IBM Plex Mono', monospace;
		color: #ffcc7f;
	}

	.feed-pagination {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font: 600 0.72rem/1 'IBM Plex Mono', monospace;
		color: #c6d0dc;
	}

	.feed-pagination button {
		padding: 0.26rem 0.48rem;
		border-radius: 0.36rem;
		border: 1px solid #3f4b5b;
		background: #142030;
		color: #dbe9f8;
		cursor: pointer;
	}

	.feed-pagination button:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.cards {
		display: grid;
		gap: 0.6rem;
		overflow: auto;
		min-height: 0;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.cards::-webkit-scrollbar {
		width: 0;
		height: 0;
	}

	.cards :global(.news-card) {
		background: #111824ef;
		border-color: #364353;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.polling-control {
		padding: 0.28rem 0.42rem;
		border: 1px solid #2d3f53;
		border-radius: 0.42rem;
		background: #101924e8;
	}

	.controls-row {
		display: flex;
		justify-content: space-between;
		gap: 0.8rem;
		align-items: center;
		margin-bottom: 0.7rem;
	}

	.filter-hint {
		margin-bottom: 0.75rem;
		font-size: 0.76rem;
	}

	.controls label {
		margin: 0;
		font: 600 0.72rem/1 'IBM Plex Mono', monospace;
		text-transform: lowercase;
		color: #9db0c4;
	}

	.controls select {
		height: 1.9rem;
		padding: 0 0.5rem;
		border-radius: 0.4rem;
		border: 1px solid #355270;
		background: #0e151f;
		color: #e4edf7;
		font: 600 0.74rem/1 'IBM Plex Mono', monospace;
	}

	.active-filter {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0.65rem;
		margin-bottom: 0.75rem;
		border: 1px solid #314355;
		background: #121b24;
		border-radius: 0.45rem;
		font-size: 0.8rem;
		color: #cdd5df;
	}

	.active-filter button {
		padding: 0.3rem 0.55rem;
		border-radius: 0.38rem;
		border: 1px solid #37597a;
		background: #162433;
		color: #dbe9f8;
		cursor: pointer;
	}

	.area-detail {
		margin: 0.22rem 0 0;
		font-size: 0.75rem;
		color: #a7bfd7;
	}

	.area-theme {
		margin: 0.2rem 0 0.45rem;
		font-size: 0.74rem;
		color: #ffcc7f;
	}

	.map-debug {
		margin: 0;
		font: 500 0.72rem/1 'IBM Plex Mono', monospace;
		color: #8ea2b7;
		white-space: nowrap;
	}

	.muted {
		margin: 0;
		color: #8f98a3;
	}

	.error {
		margin: 0;
		color: #ff7f7f;
	}

	@media (max-width: 1040px) {
		.map-scene {
			height: 100vh;
		}

		.sidebar-stack {
			width: min(35rem, 56vw);
			max-height: min(96vh, 850px);
		}

		.news-overlay {
			max-height: min(60vh, 37.2rem);
		}
	}

	/* Keep desktop panel proportions stable across larger landscape monitors. */
	@media (min-width: 1100px) and (min-height: 700px) and (orientation: landscape) {
		.sidebar-stack {
			width: 38rem;
			height: calc(100vh - 2rem);
			max-height: calc(100vh - 2rem);
		}

		.title-overlay {
			flex: 0 0 auto;
		}

		.news-overlay {
			flex: 1 1 auto;
			max-height: none;
			min-height: 0;
		}

		.sidebar-stack:has(.area-overlay) .news-overlay {
			flex: 0 0 68%;
		}

		.area-overlay {
			flex: 1 1 0;
			min-height: 11rem;
			overflow: hidden;
		}
	}

	@media (max-width: 680px) {
		.overlay-grid {
			padding: 0.75rem;
			gap: 0.65rem;
		}

		.title-overlay {
			min-height: 0;
		}

		.sidebar-stack {
			width: min(92vw, 34rem);
			max-height: calc(100vh - 1.5rem);
		}

		.controls-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.controls {
			align-items: center;
		}

		.map-debug {
			white-space: normal;
		}

		.active-filter {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
