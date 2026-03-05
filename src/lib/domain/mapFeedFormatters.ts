import { formatLocation } from '$lib/domain/markerBuilder';
import type { NewsCard, NewsCity } from '$lib/types/news';

export const formatLocationsForCard = (cities: NewsCity[]) => {
	if (cities.length === 0) {
		return 'Location unavailable';
	}
	if (cities.length === 1) {
		return formatLocation(cities[0].city, cities[0].country);
	}

	const first = formatLocation(cities[0].city, cities[0].country);
	return `${first} +${cities.length - 1} more`;
};

export const summarizeRelationship = (item: NewsCard): string | null => {
	if (item.relationships.length === 0) {
		return null;
	}

	const uniqueTypes = [...new Set(item.relationships.map((entry) => entry.relation_type))];
	return uniqueTypes.join(', ');
};
