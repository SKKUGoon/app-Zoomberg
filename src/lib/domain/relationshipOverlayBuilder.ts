import { RELATIONSHIP_COLORS, RELATIONSHIP_NOTE_SUFFIX_MORE } from '$lib/constants/relationship';
import { getNumericCoords } from '$lib/domain/markerBuilder';
import type { GlobeRelationshipOverlay, MapMarker, NewsCard, NewsRelationship } from '$lib/types/news';

type RelationshipLink = GlobeRelationshipOverlay['links'][number];
type RelationshipColor = (typeof RELATIONSHIP_COLORS)[keyof typeof RELATIONSHIP_COLORS];

const normalizeRelationNote = (relationNote: string | null) => {
	const trimmed = relationNote?.trim();
	return trimmed ? trimmed : null;
};

const mergeRelationNote = (existing: string | null, next: string | null) => {
	if (!next) {
		return existing;
	}
	if (!existing) {
		return next;
	}
	if (existing === next || existing.endsWith(RELATIONSHIP_NOTE_SUFFIX_MORE)) {
		return existing;
	}
	return `${existing}${RELATIONSHIP_NOTE_SUFFIX_MORE}`;
};

const colorForRelationType = (relationType: NewsRelationship['relation_type']): RelationshipColor => {
	if (relationType === 'Cooperate') {
		return RELATIONSHIP_COLORS.Cooperate;
	}
	if (relationType === 'Assault') {
		return RELATIONSHIP_COLORS.Assault;
	}
	return RELATIONSHIP_COLORS.Independent;
};

const addHighlight = (
	highlights: Map<string, GlobeRelationshipOverlay['highlights'][number]>,
	cityCoordMap: Map<string, { latitude: number; longitude: number }>,
	cityId: string,
	color: string
) => {
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

const upsertLink = (
	links: Map<string, RelationshipLink>,
	cityCoordMap: Map<string, { latitude: number; longitude: number }>,
	fromCityId: string,
	toCityId: string,
	color: string,
	relationType: NewsRelationship['relation_type'],
	relationNote: string | null
) => {
	const from = cityCoordMap.get(fromCityId);
	const to = cityCoordMap.get(toCityId);
	if (!from || !to) {
		return;
	}

	const key = `${fromCityId}:${toCityId}:${color}`;
	const existing = links.get(key);
	const note = normalizeRelationNote(relationNote);
	if (existing) {
		existing.relationNote = mergeRelationNote(existing.relationNote, note);
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

export const buildSelectedNewsRelationshipOverlay = (
	selectedNews: NewsCard | null
): GlobeRelationshipOverlay | null => {
	if (!selectedNews || selectedNews.cities.length < 2) {
		return null;
	}

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

	if (selectedNews.relationships.length === 0) {
		for (const cityId of cityCoordMap.keys()) {
			addHighlight(highlights, cityCoordMap, cityId, RELATIONSHIP_COLORS.Independent);
		}
		return {
			highlights: [...highlights.values()],
			links: []
		};
	}

	for (const relation of selectedNews.relationships) {
		const color = colorForRelationType(relation.relation_type);
		addHighlight(highlights, cityCoordMap, relation.from_city_id, color);
		addHighlight(highlights, cityCoordMap, relation.to_city_id, color);

		if (relation.relation_type === 'Independent') {
			continue;
		}

		upsertLink(
			links,
			cityCoordMap,
			relation.from_city_id,
			relation.to_city_id,
			color,
			relation.relation_type,
			relation.relation_note
		);
	}

	return {
		highlights: [...highlights.values()],
		links: [...links.values()]
	};
};

export const buildSelectedMarkerRelationshipOverlay = (
	selectedMarker: MapMarker | null,
	feed: NewsCard[]
): GlobeRelationshipOverlay | null => {
	if (!selectedMarker) {
		return null;
	}

	const selectedArticleIds = new Set(selectedMarker.articleIds);
	const markerItems = feed.filter((item) => selectedArticleIds.has(String(item.id)));
	if (markerItems.length === 0) {
		return null;
	}

	const cityCoordMap = new Map<string, { latitude: number; longitude: number }>();
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

	const highlights = new Map<string, GlobeRelationshipOverlay['highlights'][number]>();
	const links = new Map<string, RelationshipLink>();
	addHighlight(highlights, cityCoordMap, selectedMarker.cityId, RELATIONSHIP_COLORS.Independent);

	for (const item of markerItems) {
		for (const relation of item.relationships) {
			if (relation.from_city_id !== selectedMarker.cityId || !cityCoordMap.has(relation.to_city_id)) {
				continue;
			}

			const color = colorForRelationType(relation.relation_type);
			addHighlight(highlights, cityCoordMap, relation.to_city_id, color);

			if (relation.relation_type === 'Independent') {
				continue;
			}

			upsertLink(
				links,
				cityCoordMap,
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
};
