<script lang="ts">
	import NewsFeedCard from '$lib/components/NewsFeedCard.svelte';
	import PublishedTimeSlider from '$lib/components/PublishedTimeSlider.svelte';
	import type { MapMarker, NewsCard, NewsCity } from '$lib/types/news';

	type PollingOption = {
		label: string;
		value: number;
	};

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
		onToggleNewsSelection
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
	}>();

	let collapsed = $state(false);
</script>

<section class="news-overlay" class:collapsed>
	<div class="panel-heading-row">
		<div class="panel-heading">
			<div class="heading-title-row">
				<button
					type="button"
					class="panel-collapse-toggle"
					aria-expanded={!collapsed}
					aria-label={collapsed ? 'Expand live news feed panel' : 'Collapse live news feed panel'}
					onclick={() => {
						collapsed = !collapsed;
					}}
				>
					{collapsed ? '▸' : '▾'}
				</button>
				<h2>Live News Feed</h2>
			</div>
			<p>{loading ? 'Polling...' : `Last polled: ${lastPolledAt ? formatTime(lastPolledAt) : 'n/a'}`}</p>
		</div>
		{#if !collapsed}
			<div class="feed-pagination">
				<button type="button" onclick={onPrevPage} disabled={feedPage <= 1} aria-label="Previous feed page">Prev</button>
				<span>{feedPage}/{totalFeedPages}</span>
				<button type="button" onclick={onNextPage} disabled={feedPage >= totalFeedPages} aria-label="Next feed page">Next</button>
			</div>
		{/if}
	</div>

	{#if collapsed}
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
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: stretch;
		padding: 0.8rem;
		min-height: 0;
		height: 100%;
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

	.news-overlay.collapsed {
		margin-top: auto;
		align-self: flex-end;
		height: auto;
		max-height: min(22rem, 58vh);
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
		gap: 0.35rem;
	}

	.panel-collapse-toggle {
		width: 1rem;
		height: 1rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #3a4b5f;
		border-radius: 0.24rem;
		background: #101923;
		color: #c7d5e4;
		font: 700 0.58rem/1 'IBM Plex Mono', monospace;
		cursor: pointer;
		padding: 0;
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
