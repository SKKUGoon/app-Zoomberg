<script lang="ts">
	import { onMount } from 'svelte';
	import OpenWorldGlobe from '$lib/components/OpenWorldGlobe.svelte';
	import AreaContextPanel from '$lib/components/map/AreaContextPanel.svelte';
	import FeedOverlayPanel from '$lib/components/map/FeedOverlayPanel.svelte';
	import MapLegend from '$lib/components/map/MapLegend.svelte';
	import MapTicker from '$lib/components/map/MapTicker.svelte';
	import { buildMapMarkers, formatLocation, getNumericCoords } from '$lib/domain/markerBuilder';
	import { NewsFeedState } from '$lib/stores/newsFeed.svelte';
	import {
		CURRENCY_GREEN,
		DEVELOPED_STOCKS_BLUE,
		EMERGING_STOCKS_ORANGE,
		isBondTheme,
		isCommodityTheme,
		isCurrencyAssetTheme,
		isDevelopedStocksTheme,
		isEmergingStocksTheme,
		isEventsTheme,
		isGoldTheme,
		isOilAssetTheme,
		isPolicyTheme,
		isRealEstateTheme
	} from '$lib/domain/themeTaxonomy';
	import type { GlobeFocusTarget, GlobeRelationshipOverlay, MapMarker, NewsCard, NewsCity } from '$lib/types/news';

	const MAX_WINDOW_MS = 48 * 60 * 60 * 1000;
	const newsFeedState = new NewsFeedState({
		maxWindowMs: MAX_WINDOW_MS,
		initialPollingMs: 60_000,
		feedPageSize: 10
	});

	const pollingOptions = [
		{ label: '1 minute', value: 60_000 },
		{ label: '5 minutes', value: 300_000 },
		{ label: '10 minutes', value: 600_000 }
	] as const;

	const onPollingChange = (event: Event) => {
		newsFeedState.setPollingMsFromEvent(event);
	};

	const onTimeWindowChange = (nextStart: number) => {
		newsFeedState.updateTimeWindowStart(nextStart);
	};

	onMount(() => {
		newsFeedState.start();
		return () => newsFeedState.stop();
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

	const formatLocationsForCard = (cities: NewsCity[]) => {
		if (cities.length === 0) {
			return 'Location unavailable';
		}
		if (cities.length === 1) {
			return formatLocation(cities[0].city, cities[0].country);
		}

		const first = formatLocation(cities[0].city, cities[0].country);
		return `${first} +${cities.length - 1} more`;
	};

	const summarizeRelationship = (item: NewsCard): string | null => {
		if (item.relationships.length === 0) {
			return null;
		}

		const uniqueTypes = [...new Set(item.relationships.map((entry) => entry.relation_type))];
		return uniqueTypes.join(', ');
	};

	const focusTargetForNews = (item: NewsCard): GlobeFocusTarget | null => {
		const coords = item.cities
			.map((city) => {
				const numeric = getNumericCoords(city);
				return numeric ? { latitude: numeric.lat, longitude: numeric.lon } : null;
			})
			.filter((entry): entry is { latitude: number; longitude: number } => entry !== null);

		if (coords.length === 0) {
			return null;
		}

		if (coords.length === 1) {
			return {
				mode: 'point',
				latitude: coords[0].latitude,
				longitude: coords[0].longitude
			};
		}

		return {
			mode: 'bounds',
			coordinates: coords
		};
	};

	const mapMarkers = $derived.by(() => buildMapMarkers(newsFeedState.feed, { formatTimeLabel: formatTime }));
	const markerThemeLegend = $derived.by(() => {
		const legendMap = new Map<string, string>();
		for (const marker of mapMarkers) {
			const dominantTheme = marker.segments[0];
			if (!dominantTheme) {
				continue;
			}
			if (!legendMap.has(dominantTheme.label)) {
				legendMap.set(dominantTheme.label, dominantTheme.color);
			}
		}
		return [...legendMap.entries()]
			.map(([label, color]) => ({
				label,
				color: isCurrencyAssetTheme(label)
					? CURRENCY_GREEN
					: isDevelopedStocksTheme(label)
						? DEVELOPED_STOCKS_BLUE
						: isEmergingStocksTheme(label)
							? EMERGING_STOCKS_ORANGE
							: color,
				isOil: isOilAssetTheme(label),
				isCurrency: isCurrencyAssetTheme(label),
				isDevelopedStocks: isDevelopedStocksTheme(label),
				isEmergingStocks: isEmergingStocksTheme(label),
				isRealEstate: isRealEstateTheme(label),
				isPolicy: isPolicyTheme(label),
				isBond: isBondTheme(label),
				isCommodity: isCommodityTheme(label),
				isEvents: isEventsTheme(label),
				isGold: isGoldTheme(label)
			}))
			.sort((a, b) => a.label.localeCompare(b.label));
	});

	const filteredFeed = $derived.by(() => {
		if (!newsFeedState.selectedMarkerId) {
			return newsFeedState.feed;
		}

		const activeMarker = mapMarkers.find((marker) => marker.id === newsFeedState.selectedMarkerId);
		if (!activeMarker) {
			return newsFeedState.feed;
		}

		const idSet = new Set(activeMarker.articleIds);
		return newsFeedState.feed.filter((item) => idSet.has(String(item.id)));
	});

	const selectedNews = $derived.by(() =>
		newsFeedState.selectedNewsId === null
			? null
			: newsFeedState.feed.find((item) => item.id === newsFeedState.selectedNewsId) ?? null
	);

	const selectedNewsRelationship = $derived.by<GlobeRelationshipOverlay | null>(() => {
		if (!selectedNews || selectedNews.cities.length < 2) {
			return null;
		}

		const BLUE = '#2ac6ff';
		const GREEN = '#45ff95';
		const RED = '#ff4d4d';

		const cityCoordMap = new Map<string, { latitude: number; longitude: number }>();
		for (const city of selectedNews.cities) {
			const coords = getNumericCoords(city);
			if (!coords) {
				continue;
			}
			cityCoordMap.set(city.city_id, { latitude: coords.lat, longitude: coords.lon });
		}

		if (cityCoordMap.size < 2) {
			return null;
		}

		const highlights = new Map<string, GlobeRelationshipOverlay['highlights'][number]>();
		const links = new Map<string, GlobeRelationshipOverlay['links'][number]>();

		const addHighlight = (cityId: string, color: string) => {
			const coords = cityCoordMap.get(cityId);
			if (!coords) {
				return;
			}
			highlights.set(`${cityId}:${color}`, {
				cityId,
				latitude: coords.latitude,
				longitude: coords.longitude,
				color
			});
		};

		const addLink = (fromCityId: string, toCityId: string, color: string) => {
			const from = cityCoordMap.get(fromCityId);
			const to = cityCoordMap.get(toCityId);
			if (!from || !to) {
				return;
			}
			links.set(`${fromCityId}:${toCityId}:${color}`, {
				fromCityId,
				toCityId,
				fromLatitude: from.latitude,
				fromLongitude: from.longitude,
				toLatitude: to.latitude,
				toLongitude: to.longitude,
				color
			});
		};

		if (selectedNews.relationships.length === 0) {
			for (const cityId of cityCoordMap.keys()) {
				addHighlight(cityId, BLUE);
			}
			return {
				highlights: [...highlights.values()],
				links: []
			};
		}

		for (const relation of selectedNews.relationships) {
			if (relation.relation_type === 'Independent') {
				addHighlight(relation.from_city_id, BLUE);
				addHighlight(relation.to_city_id, BLUE);
				continue;
			}

			const color = relation.relation_type === 'Cooperate' ? GREEN : RED;
			addHighlight(relation.from_city_id, color);
			addHighlight(relation.to_city_id, color);
			addLink(relation.from_city_id, relation.to_city_id, color);
		}

		return {
			highlights: [...highlights.values()],
			links: [...links.values()]
		};
	});

	const totalFeedPages = $derived.by(() => Math.max(1, Math.ceil(filteredFeed.length / newsFeedState.feedPageSize)));
	const pagedFeed = $derived.by(() => {
		const start = (newsFeedState.feedPage - 1) * newsFeedState.feedPageSize;
		return filteredFeed.slice(start, start + newsFeedState.feedPageSize);
	});
	const topBannerItems = $derived.by(() => {
		if (newsFeedState.feed.length === 0) {
			return ['Waiting for live market news feed...'];
		}
		return newsFeedState.feed.slice(0, 12).map((item) => {
			const location = formatLocationsForCard(item.cities);
			return `${formatTime(item.time_published)} - ${item.source}: ${item.source_title} (${location})`;
		});
	});
	const bottomBannerItems = $derived.by(() => {
		if (mapMarkers.length === 0) {
			return ['No geolocated markers available for the current time window.'];
		}
		return mapMarkers.slice(0, 12).map((marker) => {
			const dominantTheme = marker.segments[0]?.label ?? 'Unknown theme';
			return `${marker.title} - ${marker.total} article(s) - ${dominantTheme}`;
		});
	});

	$effect(() => {
		newsFeedState.clampFeedPage(totalFeedPages);
	});

	$effect(() => {
		void filteredFeed.length;
		newsFeedState.resetFeedPage();
	});

	const selectedMarker = $derived(mapMarkers.find((marker) => marker.id === newsFeedState.selectedMarkerId) ?? null);

	const onMarkerOpen = (markerId: string) => {
		newsFeedState.setSelectedMarkerId(markerId);
	};

	const onMarkerClose = () => {
		newsFeedState.setSelectedMarkerId(null);
	};

	const clearMarkerFilter = () => {
		newsFeedState.setSelectedMarkerId(null);
	};

	const toggleNewsSelection = (newsId: number) => {
		newsFeedState.toggleNewsSelection(newsId, focusTargetForNews);
	};

	const gotoPrevFeedPage = () => {
		newsFeedState.gotoPrevFeedPage();
	};

	const gotoNextFeedPage = () => {
		newsFeedState.gotoNextFeedPage(totalFeedPages);
	};

</script>

<section class="map-scene">
	<OpenWorldGlobe
		markers={mapMarkers}
		selectedMarkerId={newsFeedState.selectedMarkerId}
		newsRelationshipOverlay={selectedNewsRelationship}
		newsFocusTarget={newsFeedState.newsFocusTarget}
		onMarkerOpen={onMarkerOpen}
		onMarkerClose={onMarkerClose}
	/>
	<MapTicker items={topBannerItems} position="top" ariaLabel="Live news ticker" />
	<MapTicker items={bottomBannerItems} position="bottom" ariaLabel="Area summary ticker" />

	<div class="overlay-grid">
		<div class="sidebar-stack">
			<section class="title-overlay">
				<p class="eyebrow">Globe</p>
				<h1>Global Context and Event Console</h1>
			</section>

			<FeedOverlayPanel
				loading={newsFeedState.loading}
				lastPolledAt={newsFeedState.lastPolledAt}
				{formatTime}
				feedPage={newsFeedState.feedPage}
				{totalFeedPages}
				onPrevPage={gotoPrevFeedPage}
				onNextPage={gotoNextFeedPage}
				pollingMs={newsFeedState.pollingMs}
				pollingOptions={[...pollingOptions]}
				onPollingChange={onPollingChange}
				mapMarkerCount={mapMarkers.length}
				feedRowCount={newsFeedState.feed.length}
				totalItems={newsFeedState.totalItems}
				minMs={newsFeedState.minPublishedIso ? new Date(newsFeedState.minPublishedIso).getTime() : null}
				maxMs={newsFeedState.maxPublishedIso ? new Date(newsFeedState.maxPublishedIso).getTime() : null}
				startMs={newsFeedState.windowStartMs}
				maxWindowMs={MAX_WINDOW_MS}
				onTimeWindowChange={onTimeWindowChange}
				{selectedMarker}
				onClearMarkerFilter={clearMarkerFilter}
				error={newsFeedState.error}
				filteredFeedLength={filteredFeed.length}
				{pagedFeed}
				selectedNewsId={newsFeedState.selectedNewsId}
				{formatLocationsForCard}
				{summarizeRelationship}
				onToggleNewsSelection={toggleNewsSelection}
			/>

			{#if selectedMarker}
				<AreaContextPanel marker={selectedMarker} />
			{/if}
		</div>
	</div>
	<MapLegend items={markerThemeLegend} />
</section>

<style>
	.map-scene {
		position: relative;
		height: 100vh;
		width: 100%;
		--globe-banner-offset: 0.75rem;
		--globe-banner-safe-top: 2.25rem;
		--globe-banner-safe-bottom: 5.5rem;
	}

	.overlay-grid {
		position: absolute;
		inset: 0;
		display: flex;
		justify-content: flex-end;
		align-items: stretch;
		padding: calc(var(--globe-banner-offset) + var(--globe-banner-safe-top)) 1rem
			calc(var(--globe-banner-offset) + var(--globe-banner-safe-bottom));
		gap: 0.9rem;
		pointer-events: none;
		z-index: 500;
		box-sizing: border-box;
	}

	.sidebar-stack {
		pointer-events: none;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		width: min(38rem, 47vw);
		min-height: 0;
		max-height: calc(100vh - (var(--globe-banner-offset) + var(--globe-banner-safe-top)) - (var(--globe-banner-offset) + var(--globe-banner-safe-bottom)));
		overflow: hidden;
	}

	.title-overlay {
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

	@media (max-width: 1040px) {
		.map-scene {
			height: 100vh;
		}

		.sidebar-stack {
			width: min(35rem, 56vw);
			max-height: min(96vh, 850px);
		}
	}

	@media (min-width: 1100px) and (min-height: 700px) and (orientation: landscape) {
		.sidebar-stack {
			width: 38rem;
			height: calc(100vh - (var(--globe-banner-offset) + var(--globe-banner-safe-top)) - (var(--globe-banner-offset) + var(--globe-banner-safe-bottom)));
			max-height: calc(100vh - (var(--globe-banner-offset) + var(--globe-banner-safe-top)) - (var(--globe-banner-offset) + var(--globe-banner-safe-bottom)));
		}

		.title-overlay {
			flex: 0 0 auto;
		}
	}

	@media (max-width: 680px) {
		.overlay-grid {
			padding: calc(var(--globe-banner-offset) + var(--globe-banner-safe-top)) 0.75rem
				calc(var(--globe-banner-offset) + var(--globe-banner-safe-bottom));
			gap: 0.65rem;
		}

		.title-overlay {
			min-height: 0;
		}

		.sidebar-stack {
			width: min(92vw, 34rem);
			max-height: calc(100vh - 1.5rem);
		}
	}
</style>
