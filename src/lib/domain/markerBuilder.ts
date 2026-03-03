import type { MapMarker, NewsCard, NewsCity } from '$lib/types/news';
import { colorForTheme } from '$lib/domain/themeTaxonomy';

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
	'coindesk'
]);

export const tokenize = (value: string | null | undefined): string[] => {
	if (!value) {
		return [];
	}

	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter((word) => word.length >= 3 && !stopWords.has(word));
};

export const formatLocation = (city: string | null, country: string | null) => {
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

export const getNumericCoords = (city: NewsCity): { lat: number; lon: number } | null => {
	if (city.latitude === null || city.longitude === null) {
		return null;
	}

	const lat = Number(city.latitude);
	const lon = Number(city.longitude);
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
		return null;
	}

	return { lat, lon };
};

const markerKeyForCity = (city: NewsCity): string | null => {
	const coords = getNumericCoords(city);
	if (!coords) {
		return null;
	}

	return city.city_id || `${coords.lat.toFixed(4)}:${coords.lon.toFixed(4)}`;
};

type BuildMapMarkersOptions = {
	formatTimeLabel: (isoDate: string) => string;
};

export const buildMapMarkers = (items: NewsCard[], options: BuildMapMarkersOptions): MapMarker[] => {
	const grouped = new Map<
		string,
		{
			cityId: string;
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
		for (const city of item.cities) {
			const key = markerKeyForCity(city);
			if (!key) {
				continue;
			}

			const coords = getNumericCoords(city);
			if (!coords) {
				continue;
			}

			const current = grouped.get(key);
			const theme = item.keyword_theme_upper.trim() || 'UNKNOWN';
			const itemId = String(item.id);

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
					cityId: city.city_id,
					latitude: coords.lat,
					longitude: coords.lon,
					location: formatLocation(city.city, city.country),
					total: 1,
					themes: themeMap,
					words: wordMap,
					articleIds: [itemId],
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
			if (!current.articleIds.includes(itemId)) {
				current.articleIds.push(itemId);
			}
		}
	}

	return [...grouped.entries()]
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
				cityId: group.cityId,
				latitude: group.latitude,
				longitude: group.longitude,
				title: group.location,
				detail: `${group.total} article(s) - ${options.formatTimeLabel(group.latestTime)} - ${group.latitude.toFixed(4)}, ${group.longitude.toFixed(4)}`,
				total: group.total,
				segments,
				wordCloud,
				articleIds: group.articleIds
			};
		})
		.sort((a, b) => b.total - a.total);
};
