<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import OpenWorldGlobe from '$lib/components/OpenWorldGlobe.svelte';
	import FeedOverlayPanel from '$lib/components/map/FeedOverlayPanel.svelte';
	import EmptyFeedLikePanel from '$lib/components/map/EmptyFeedLikePanel.svelte';
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

	type RelationshipLink = {
		fromCityId: string;
		toCityId: string;
		fromLatitude: number;
		fromLongitude: number;
		toLatitude: number;
		toLongitude: number;
		color: string;
		relationType: 'Assault' | 'Cooperate' | 'Independent';
		relationNote: string | null;
	};

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

	type PanelMode = 'full' | 'summary' | 'minimized';
	let liveNewsPanelMode = $state<PanelMode>('summary');
	let polymarketPanelMode = $state<PanelMode>('summary');
	let twitterPanelMode = $state<PanelMode>('summary');
	const allPanelsSummary = $derived.by(
		() =>
			liveNewsPanelMode === 'summary' &&
			polymarketPanelMode === 'summary' &&
			twitterPanelMode === 'summary'
	);
	const hasFullPanel = $derived.by(
		() => liveNewsPanelMode === 'full' || polymarketPanelMode === 'full' || twitterPanelMode === 'full'
	);

	const setLiveNewsPanelMode = (nextMode: PanelMode) => {
		liveNewsPanelMode = nextMode;
		if (nextMode === 'full') {
			polymarketPanelMode = 'minimized';
			twitterPanelMode = 'minimized';
		}
	};

	const setPolymarketPanelMode = (nextMode: PanelMode) => {
		polymarketPanelMode = nextMode;
		if (nextMode === 'full') {
			liveNewsPanelMode = 'minimized';
			twitterPanelMode = 'minimized';
		}
	};

	const setTwitterPanelMode = (nextMode: PanelMode) => {
		twitterPanelMode = nextMode;
		if (nextMode === 'full') {
			liveNewsPanelMode = 'minimized';
			polymarketPanelMode = 'minimized';
		}
	};

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
	const selectedMarker = $derived(mapMarkers.find((marker) => marker.id === newsFeedState.selectedMarkerId) ?? null);

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
		const links = new Map<string, RelationshipLink>();

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
			const key = `${fromCityId}:${toCityId}:${color}`;
			const existing = links.get(key);
			if (existing) {
				return;
			}
			links.set(key, {
				fromCityId,
				toCityId,
				fromLatitude: from.latitude,
				fromLongitude: from.longitude,
				toLatitude: to.latitude,
				toLongitude: to.longitude,
				color,
				relationType: 'Independent',
				relationNote: null
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
			const key = `${relation.from_city_id}:${relation.to_city_id}:${color}`;
			const existing = links.get(key);
			const note = relation.relation_note?.trim() ? relation.relation_note.trim() : null;
			if (existing) {
				if (!existing.relationNote && note) {
					existing.relationNote = note;
				} else if (existing.relationNote && note && existing.relationNote !== note && !existing.relationNote.endsWith(' (more)')) {
					existing.relationNote = `${existing.relationNote} (more)`;
				}
				continue;
			}
			addLink(relation.from_city_id, relation.to_city_id, color);
			const created = links.get(key);
			if (created) {
				created.relationType = relation.relation_type;
				created.relationNote = note;
			}
		}

		return {
			highlights: [...highlights.values()],
			links: [...links.values()]
		};
	});

	const selectedMarkerRelationship = $derived.by<GlobeRelationshipOverlay | null>(() => {
		if (!selectedMarker) {
			return null;
		}

		const BLUE = '#2ac6ff';
		const GREEN = '#45ff95';
		const RED = '#ff4d4d';
		const selectedArticleIds = new Set(selectedMarker.articleIds);
		const markerItems = newsFeedState.feed.filter((item) => selectedArticleIds.has(String(item.id)));
		if (markerItems.length === 0) {
			return null;
		}

		const highlights = new Map<string, GlobeRelationshipOverlay['highlights'][number]>();
		const links = new Map<string, RelationshipLink>();
		const cityCoordMap = new Map<string, { latitude: number; longitude: number }>();

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

		const addLink = (
			fromCityId: string,
			toCityId: string,
			color: string,
			relationType: RelationshipLink['relationType'],
			relationNote: string | null
		) => {
			const from = cityCoordMap.get(fromCityId);
			const to = cityCoordMap.get(toCityId);
			if (!from || !to) {
				return;
			}
			const key = `${fromCityId}:${toCityId}:${color}`;
			const existing = links.get(key);
			const note = relationNote?.trim() ? relationNote.trim() : null;
			if (existing) {
				if (!existing.relationNote && note) {
					existing.relationNote = note;
				} else if (existing.relationNote && note && existing.relationNote !== note && !existing.relationNote.endsWith(' (more)')) {
					existing.relationNote = `${existing.relationNote} (more)`;
				}
				return;
			}
			links.set(key, {
				fromCityId,
				toCityId,
				fromLatitude: from.latitude,
				fromLongitude: from.longitude,
				toLatitude: to.latitude,
				toLongitude: to.longitude,
				color,
				relationType,
				relationNote: note
			});
		};

		cityCoordMap.set(selectedMarker.cityId, {
			latitude: selectedMarker.latitude,
			longitude: selectedMarker.longitude
		});

		for (const item of markerItems) {
			for (const city of item.cities) {
				const coords = getNumericCoords(city);
				if (!coords) {
					continue;
				}
				cityCoordMap.set(city.city_id, { latitude: coords.lat, longitude: coords.lon });
			}
		}

		if (cityCoordMap.size < 1) {
			return null;
		}

		addHighlight(selectedMarker.cityId, BLUE);

		for (const item of markerItems) {
			for (const relation of item.relationships) {
				if (relation.from_city_id !== selectedMarker.cityId) {
					continue;
				}
				if (!cityCoordMap.has(relation.to_city_id)) {
					continue;
				}

				if (relation.relation_type === 'Independent') {
					addHighlight(relation.to_city_id, BLUE);
					continue;
				}

				const color = relation.relation_type === 'Cooperate' ? GREEN : RED;
				addHighlight(relation.to_city_id, color);
				addLink(
					relation.from_city_id,
					relation.to_city_id,
					color,
					relation.relation_type,
					relation.relation_note
				);
			}
		}

		return {
			highlights: [...highlights.values()],
			links: [...links.values()]
		};
	});

	const activeRelationshipOverlay = $derived.by<GlobeRelationshipOverlay | null>(() => {
		if (selectedMarkerRelationship) {
			return selectedMarkerRelationship;
		}
		if (selectedNewsRelationship) {
			return selectedNewsRelationship;
		}
		return null;
	});

	const totalFeedPages = $derived.by(() => Math.max(1, Math.ceil(filteredFeed.length / newsFeedState.feedPageSize)));
	const latestFilteredFeedItem = $derived.by(() => filteredFeed[0] ?? null);
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

	const mapContextLabel = $derived.by(() => {
		const path = page.url.pathname;
		if (path.startsWith('/map/korea_estate')) {
			return 'South Korea Real Estate (WIP)';
		}
		if (path.startsWith('/map/tokyo_estate')) {
			return 'Tokyo Real Estate (WIP)';
		}
		return 'Global Context';
	});

	$effect(() => {
		newsFeedState.clampFeedPage(totalFeedPages);
	});

	$effect(() => {
		void filteredFeed.length;
		newsFeedState.resetFeedPage();
	});

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
		newsRelationshipOverlay={activeRelationshipOverlay}
		newsFocusTarget={newsFeedState.newsFocusTarget}
		onMarkerOpen={onMarkerOpen}
		onMarkerClose={onMarkerClose}
	/>
	<div class="top-row">
		<MapLegend items={markerThemeLegend} {mapContextLabel} />
		<div class="upper-bar">
			<MapTicker items={topBannerItems} position="top" ariaLabel="Live news ticker" inline={true} />
		</div>
	</div>
	<div class="lower-bar">
		<MapTicker items={bottomBannerItems} position="bottom" ariaLabel="Area summary ticker" />
	</div>

	<div class="overlay-grid">
		<div class="sidebar-stack" class:all-summary={allPanelsSummary} class:has-full={hasFullPanel}>
			<div class="panel-slot" class:slot-full={liveNewsPanelMode === 'full'} class:slot-summary={liveNewsPanelMode === 'summary'}>
				<FeedOverlayPanel
				mode={liveNewsPanelMode}
				onModeChange={setLiveNewsPanelMode}
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
				latestFeedItem={latestFilteredFeedItem}
				{pagedFeed}
				selectedNewsId={newsFeedState.selectedNewsId}
				{formatLocationsForCard}
				{summarizeRelationship}
				onToggleNewsSelection={toggleNewsSelection}
				/>
			</div>
			<div class="panel-slot" class:slot-full={polymarketPanelMode === 'full'} class:slot-summary={polymarketPanelMode === 'summary'}>
				<EmptyFeedLikePanel
					title="Polymarket"
					mode={polymarketPanelMode}
					onModeChange={setPolymarketPanelMode}
				/>
			</div>
			<div class="panel-slot" class:slot-full={twitterPanelMode === 'full'} class:slot-summary={twitterPanelMode === 'summary'}>
				<EmptyFeedLikePanel
					title="X"
					mode={twitterPanelMode}
					onModeChange={setTwitterPanelMode}
				/>
			</div>
		</div>
	</div>
</section>

<style>
	.map-scene {
		position: relative;
		height: 100vh;
		width: 100%;
		--globe-banner-offset: 0.75rem;
		--globe-banner-safe-top: 2.5rem;
		--globe-banner-safe-bottom: 2.45rem;
		--overlay-top-gap: 0.275rem;
		--overlay-bottom-gap: 0.825rem;
	}

	.overlay-grid {
		position: absolute;
		inset: 0;
		display: flex;
		justify-content: flex-end;
		align-items: stretch;
		padding: calc(var(--globe-banner-offset) + var(--globe-banner-safe-top) + var(--overlay-top-gap))
			1rem calc(var(--globe-banner-offset) + var(--globe-banner-safe-bottom) + var(--overlay-bottom-gap));
		gap: 0.9rem;
		pointer-events: none;
		z-index: 500;
		box-sizing: border-box;
	}

	.top-row {
		position: absolute;
		top: var(--globe-banner-offset);
		left: 1rem;
		right: 1rem;
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		z-index: 515;
	}

	.upper-bar {
		flex: 1 1 auto;
		min-width: 0;
	}

	.sidebar-stack {
		pointer-events: none;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.9rem;
		width: min(30rem, 35vw);
		min-width: min(30rem, 35vw);
		max-width: 30rem;
		min-height: 0;
		height: calc(
			100vh - (var(--globe-banner-offset) + var(--globe-banner-safe-top) + var(--overlay-top-gap)) -
				(var(--globe-banner-offset) + var(--globe-banner-safe-bottom) + var(--overlay-bottom-gap))
		);
		max-height: calc(
			100vh - (var(--globe-banner-offset) + var(--globe-banner-safe-top) + var(--overlay-top-gap)) -
				(var(--globe-banner-offset) + var(--globe-banner-safe-bottom) + var(--overlay-bottom-gap))
		);
		overflow: hidden;
	}

	.panel-slot {
		width: 100%;
		display: flex;
		min-height: 0;
		pointer-events: none;
	}

	.sidebar-stack.all-summary .panel-slot {
		flex: 1 1 0;
	}

	.sidebar-stack.all-summary .panel-slot :global(.news-overlay.summary),
	.sidebar-stack.all-summary .panel-slot :global(.panel.summary) {
		height: 100%;
		max-height: none;
	}

	.sidebar-stack.has-full .panel-slot.slot-full {
		flex: 1 1 0;
	}

	.sidebar-stack.has-full .panel-slot.slot-summary {
		flex: 0 0 auto;
	}

	@media (max-width: 1040px) {
		.map-scene {
			height: 100vh;
		}

		.sidebar-stack {
			width: min(30rem, 56vw);
			min-width: min(30rem, 56vw);
			max-height: min(96vh, 850px);
		}
	}

	@media (min-width: 1100px) and (min-height: 700px) and (orientation: landscape) {
		.sidebar-stack {
			height: calc(100vh - (var(--globe-banner-offset) + var(--globe-banner-safe-top)) - (var(--globe-banner-offset) + var(--globe-banner-safe-bottom)));
			max-height: calc(100vh - (var(--globe-banner-offset) + var(--globe-banner-safe-top)) - (var(--globe-banner-offset) + var(--globe-banner-safe-bottom)));
		}

	}

	@media (max-width: 680px) {
		.top-row {
			left: 0.75rem;
			right: 0.75rem;
		}

		.overlay-grid {
			padding: calc(var(--globe-banner-offset) + var(--globe-banner-safe-top)) 0.75rem
				calc(var(--globe-banner-offset) + var(--globe-banner-safe-bottom));
			gap: 0.65rem;
		}

		.sidebar-stack {
			width: min(92vw, 34rem);
			min-width: 0;
			max-width: 34rem;
			max-height: calc(100vh - 1.5rem);
		}
	}

	@media (max-width: 860px) {
		.upper-bar,
		.lower-bar {
			display: none;
		}

		.top-row {
			right: auto;
		}
	}

	@media (max-width: 34rem) {

		.overlay-grid {
			padding: 0.75rem;
		}

		.sidebar-stack {
			width: 100%;
			max-width: none;
			min-width: 0;
			max-height: calc(100vh - 1.5rem);
		}
	}
</style>
