<script lang="ts">
	import NewsFeedCard from '$lib/components/NewsFeedCard.svelte';
	import PublishedTimeSlider from '$lib/components/PublishedTimeSlider.svelte';
	import type { MapMarker, NewsCard, NewsCity } from '$lib/types/news';

	type PollingOption = {
		label: string;
		value: number;
	};

	type PanelMode = 'full' | 'summary' | 'minimized';

	let {
		loading,
		lastPolledAt,
		formatTime,
		feedPage,
		totalFeedPages,
		onPrevPage,
		onNextPage,
		pollingMs,
		pollingOptions,
		onPollingChange,
		mapMarkerCount,
		feedRowCount,
		totalItems,
		minMs,
		maxMs,
		startMs,
		maxWindowMs,
		onTimeWindowChange,
		selectedMarker,
		onClearMarkerFilter,
		error,
		filteredFeedLength,
		latestFeedItem,
		pagedFeed,
		selectedNewsId,
		formatLocationsForCard,
		summarizeRelationship,
		onToggleNewsSelection,
		mode,
		onModeChange
	} = $props<{
		loading: boolean;
		lastPolledAt: string;
		formatTime: (isoDate: string) => string;
		feedPage: number;
		totalFeedPages: number;
		onPrevPage: () => void;
		onNextPage: () => void;
		pollingMs: number;
		pollingOptions: PollingOption[];
		onPollingChange: (event: Event) => void;
		mapMarkerCount: number;
		feedRowCount: number;
		totalItems: number;
		minMs: number | null;
		maxMs: number | null;
		startMs: number | null;
		maxWindowMs: number;
		onTimeWindowChange: (nextStart: number) => void;
		selectedMarker: MapMarker | null;
		onClearMarkerFilter: () => void;
		error: string;
		filteredFeedLength: number;
		latestFeedItem: NewsCard | null;
		pagedFeed: NewsCard[];
		selectedNewsId: number | null;
		formatLocationsForCard: (cities: NewsCity[]) => string;
		summarizeRelationship: (item: NewsCard) => string | null;
		onToggleNewsSelection: (newsId: number) => void;
		mode: PanelMode;
		onModeChange: (nextMode: PanelMode) => void;
	}>();

	const setMode = (nextMode: PanelMode) => {
		if (mode !== nextMode) {
			onModeChange(nextMode);
		}
	};
</script>

<section class="news-overlay" class:summary={mode === 'summary'} class:minimized={mode === 'minimized'}>
	<div class="panel-heading-row">
		<div class="panel-heading">
			<div class="heading-title-row">
				<div class="panel-mode-controls" role="toolbar" aria-label="Live news feed panel mode">
					<button
						type="button"
						class="mode-dot mode-minimized"
						class:active={mode === 'minimized'}
						aria-label="Minimize live news feed panel"
						onclick={() => setMode('minimized')}
					>
						<span aria-hidden="true">-</span>
					</button>
					<button
						type="button"
						class="mode-dot mode-summary"
						class:active={mode === 'summary'}
						aria-label="Show summary live news feed panel"
						onclick={() => setMode('summary')}
					>
						<span aria-hidden="true">~</span>
					</button>
					<button
						type="button"
						class="mode-dot mode-full"
						class:active={mode === 'full'}
						aria-label="Open full live news feed panel"
						onclick={() => setMode('full')}
					>
						<span aria-hidden="true">+</span>
					</button>
				</div>
				<h2>Live News Feed</h2>
			</div>
			{#if mode !== 'minimized'}
				<p>{loading ? 'Polling...' : `Last polled: ${lastPolledAt ? formatTime(lastPolledAt) : 'n/a'}`}</p>
			{/if}
		</div>
		{#if mode === 'full'}
			<div class="feed-pagination">
				<button type="button" onclick={onPrevPage} disabled={feedPage <= 1} aria-label="Previous feed page">Prev</button>
				<span>{feedPage}/{totalFeedPages}</span>
				<button type="button" onclick={onNextPage} disabled={feedPage >= totalFeedPages} aria-label="Next feed page">Next</button>
			</div>
		{/if}
	</div>

	{#if mode === 'minimized'}
		<div class="minimized-strip" aria-label="Live News Feed minimized">Live News Feed panel</div>
	{:else if mode === 'summary'}
		{#if latestFeedItem}
			<div class="cards collapsed-cards">
				<NewsFeedCard
					source={latestFeedItem.source}
					title={latestFeedItem.source_title}
					summary={latestFeedItem.summary}
					timeLabel={formatTime(latestFeedItem.time_published)}
					link={latestFeedItem.source_link}
					locationLabel={formatLocationsForCard(latestFeedItem.cities)}
					themeUpperLabel={latestFeedItem.keyword_theme_upper}
					themeLowerLabel={latestFeedItem.keyword_theme_lower}
					geoRelationshipLabel={summarizeRelationship(latestFeedItem)}
					selected={selectedNewsId === latestFeedItem.id}
					onSelect={() => onToggleNewsSelection(latestFeedItem.id)}
				/>
			</div>
		{:else}
			<p class="muted">No cards for the selected published-time range.</p>
		{/if}
	{:else}
		<div class="controls-row">
			<div class="controls polling-control">
				<label for="polling-select">Auto polling</label>
				<select id="polling-select" value={pollingMs} onchange={onPollingChange}>
					{#each pollingOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
			<p class="map-debug">{mapMarkerCount} markers | {feedRowCount} rows | {totalItems} total</p>
		</div>

		<PublishedTimeSlider
			{minMs}
			{maxMs}
			{startMs}
			{maxWindowMs}
			onChangeStart={onTimeWindowChange}
			disabled={loading}
		/>

		{#if selectedMarker}
			<div class="active-filter">
				<span>Filtered by area: {selectedMarker.title} ({selectedMarker.total} articles)</span>
				<button type="button" onclick={onClearMarkerFilter}>Clear filter</button>
			</div>
		{:else}
			<p class="muted filter-hint">Select a globe marker to filter the feed.</p>
		{/if}

		{#if error}
			<p class="error">{error}</p>
		{:else if filteredFeedLength === 0}
			<p class="muted">No cards for the selected published-time range.</p>
		{:else}
			<div class="cards">
				{#each pagedFeed as item}
					<NewsFeedCard
						source={item.source}
						title={item.source_title}
						summary={item.summary}
						timeLabel={formatTime(item.time_published)}
						link={item.source_link}
						locationLabel={formatLocationsForCard(item.cities)}
						themeUpperLabel={item.keyword_theme_upper}
						themeLowerLabel={item.keyword_theme_lower}
						geoRelationshipLabel={summarizeRelationship(item)}
						selected={selectedNewsId === item.id}
						onSelect={() => onToggleNewsSelection(item.id)}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</section>

<style>
	.news-overlay {
		pointer-events: auto;
		width: 100%;
		max-width: 30rem;
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: stretch;
		padding: 0.8rem;
		min-height: 0;
		height: auto;
		min-width: 0;
		max-height: none;
		overflow: hidden;
		border: 1px solid #f3f6fb1f;
		backdrop-filter: blur(14px);
		background: linear-gradient(145deg, #0c131bc9, #111a25a8);
		box-shadow: 0 16px 40px #02060c88;
		border-radius: 0.8rem;
		transform-origin: right bottom;
		transition: box-shadow 140ms ease;
	}

	.news-overlay.summary {
		flex: 0 0 auto;
		height: auto;
		max-height: min(22rem, 58vh);
	}

	.news-overlay.minimized {
		flex: 0 0 auto;
		margin-top: auto;
		align-self: flex-end;
		height: auto;
		width: 100%;
		max-width: 30rem;
		padding: 0.55rem 0.7rem;
	}

	.panel-heading-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.6rem;
		min-width: 0;
		flex-shrink: 0;
	}

	.panel-heading h2 {
		margin: 0;
		font: 600 0.95rem/1.2 'IBM Plex Sans', sans-serif;
		color: #f6fbff;
	}

	.heading-title-row {
		display: flex;
		align-items: center;
		gap: 0.42rem;
	}

	.panel-mode-controls {
		display: inline-flex;
		align-items: center;
		gap: 0.34rem;
	}

	.mode-dot {
		width: 0.92rem;
		height: 0.92rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		border: 1px solid #00000066;
		padding: 0;
		cursor: pointer;
		color: #000000c7;
		font: 700 0.58rem/1 'IBM Plex Mono', monospace;
		opacity: 0.7;
	}

	.mode-dot span {
		line-height: 1;
	}

	.mode-dot.active {
		opacity: 1;
		box-shadow: 0 0 0 1px #dce7f47a;
	}

	.mode-minimized {
		background: #ff5f57;
	}

	.mode-summary {
		background: #febc2e;
	}

	.mode-full {
		background: #28c840;
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

	.minimized-strip {
		margin-top: 0.12rem;
		font: 600 0.74rem/1.15 'IBM Plex Mono', monospace;
		color: #d8e8fb;
		white-space: nowrap;
	}

	.controls-row {
		display: flex;
		justify-content: space-between;
		gap: 0.8rem;
		align-items: center;
		margin-bottom: 0.7rem;
		min-width: 0;
		flex-shrink: 0;
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

	.map-debug {
		margin: 0;
		font: 500 0.72rem/1 'IBM Plex Mono', monospace;
		color: #8ea2b7;
		white-space: nowrap;
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

	.filter-hint {
		margin-bottom: 0.75rem;
		font-size: 0.76rem;
	}

	.muted {
		margin: 0;
		color: #8f98a3;
	}

	.error {
		margin: 0;
		color: #ff7f7f;
	}

	.cards {
		display: grid;
		gap: 0.6rem;
		flex: 1 1 auto;
		overflow: auto;
		min-height: 0;
		min-width: 0;
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
		min-width: 0;
	}

	.collapsed-cards {
		overflow: hidden;
		flex: 0 0 auto;
	}

	@media (max-width: 1040px) {
		.news-overlay {
			max-height: min(60vh, 37.2rem);
		}
	}

	@media (min-width: 1100px) and (min-height: 700px) and (orientation: landscape) {
		.news-overlay {
			flex: 1 1 auto;
			max-height: none;
			min-height: 0;
		}
	}

	@media (max-width: 680px) {
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
