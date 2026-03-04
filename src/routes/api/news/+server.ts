import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { and, asc, count, desc, eq, gte, inArray, lte, max, min } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { dimCity, factDistilledNews, mapNewsCities, mapNewsRelationship } from '$lib/server/db/schema';

const DEFAULT_WINDOW_HOURS = 24;
const MAX_WINDOW_HOURS = 48;
const MAX_WINDOW_MS = MAX_WINDOW_HOURS * 60 * 60 * 1000;

type TimeBounds = {
	min: Date | null;
	max: Date | null;
};

type RelationType = 'Assault' | 'Cooperate' | 'Independent';

let cachedBounds: TimeBounds | null = null;

const getPublishedBounds = async (): Promise<TimeBounds> => {
	if (cachedBounds) {
		return cachedBounds;
	}

	const [row] = await db
		.select({
			minPublished: min(factDistilledNews.timePublished),
			maxPublished: max(factDistilledNews.timePublished)
		})
		.from(factDistilledNews);

	cachedBounds = {
		min: row?.minPublished ?? null,
		max: row?.maxPublished ?? null
	};

	return cachedBounds;
};

const clampWindowToBounds = (requestedStart: Date, requestedEnd: Date, bounds: TimeBounds) => {
	const minBound = bounds.min;
	const maxBound = bounds.max ?? new Date();

	if (!minBound) {
		return {
			start: requestedStart,
			end: requestedEnd
		};
	}

	let startMs = requestedStart.getTime();
	let endMs = requestedEnd.getTime();
	const minMs = minBound.getTime();
	const maxMs = maxBound.getTime();

	if (Number.isNaN(startMs)) {
		startMs = Math.max(minMs, maxMs - DEFAULT_WINDOW_HOURS * 60 * 60 * 1000);
	}

	if (Number.isNaN(endMs)) {
		endMs = maxMs;
	}

	startMs = Math.max(minMs, Math.min(maxMs, startMs));
	endMs = Math.max(minMs, Math.min(maxMs, endMs));

	if (startMs > endMs) {
		[startMs, endMs] = [endMs, startMs];
	}

	if (endMs - startMs > MAX_WINDOW_MS) {
		startMs = endMs - MAX_WINDOW_MS;
		if (startMs < minMs) {
			startMs = minMs;
			endMs = Math.min(maxMs, startMs + MAX_WINDOW_MS);
		}
	}

	return {
		start: new Date(startMs),
		end: new Date(endMs)
	};
};

const parseRequestedWindow = (url: URL, bounds: TimeBounds) => {
	const startParam = url.searchParams.get('start');
	const endParam = url.searchParams.get('end');

	const fallbackEnd = bounds.max ?? new Date();
	const fallbackStart = new Date(fallbackEnd.getTime() - DEFAULT_WINDOW_HOURS * 60 * 60 * 1000);

	const requestedStart = startParam ? new Date(startParam) : fallbackStart;
	const requestedEnd = endParam ? new Date(endParam) : fallbackEnd;

	return clampWindowToBounds(requestedStart, requestedEnd, bounds);
};

void getPublishedBounds().catch((error) => {
	console.error('failed to preload published bounds', error);
	cachedBounds = null;
});

export const GET: RequestHandler = async ({ url }) => {
	try {
		const bounds = await getPublishedBounds();
		const { start, end } = parseRequestedWindow(url, bounds);
		const whereFilter = and(gte(factDistilledNews.timePublished, start), lte(factDistilledNews.timePublished, end));

		const [{ totalItems }] = await db
			.select({ totalItems: count(factDistilledNews.id) })
			.from(factDistilledNews)
			.where(whereFilter);

		const newsRows = await db
			.select({
				id: factDistilledNews.id,
				rss_item_id: factDistilledNews.rssItemId,
				source: factDistilledNews.source,
				source_title: factDistilledNews.sourceTitle,
				source_link: factDistilledNews.sourceLink,
				summary: factDistilledNews.summary,
				time_published: factDistilledNews.timePublished,
				keyword_theme_upper: factDistilledNews.keywordThemeUpper,
				keyword_theme_lower: factDistilledNews.keywordThemeLower,
				llm_model: factDistilledNews.llmModel,
				gatekeeper_reason: factDistilledNews.gatekeeperReason,
				agent_trace: factDistilledNews.agentTrace,
				processed_at: factDistilledNews.processedAt,
				created_at: factDistilledNews.createdAt,
				updated_at: factDistilledNews.updatedAt
			})
			.from(factDistilledNews)
			.where(whereFilter)
			.orderBy(desc(factDistilledNews.timePublished));

		const newsIds = newsRows.map((row) => row.id);

		const cityRows = newsIds.length
			? await db
					.select({
						news_id: mapNewsCities.newsId,
						city_id: dimCity.cityId,
						city: dimCity.city,
						country: dimCity.country,
						latitude: dimCity.latitude,
						longitude: dimCity.longitude
					})
					.from(mapNewsCities)
					.innerJoin(dimCity, eq(dimCity.cityId, mapNewsCities.cityId))
					.where(inArray(mapNewsCities.newsId, newsIds))
					.orderBy(asc(dimCity.country), asc(dimCity.city))
			: [];

		const relationRows = newsIds.length
			? await db
					.select({
						news_id: mapNewsRelationship.newsId,
						from_city_id: mapNewsRelationship.fromCityId,
						to_city_id: mapNewsRelationship.toCityId,
						relation_type: mapNewsRelationship.relationType,
						relation_note: mapNewsRelationship.relationNote
					})
					.from(mapNewsRelationship)
					.where(inArray(mapNewsRelationship.newsId, newsIds))
			: [];

		const citiesByNewsId = new Map<number, typeof cityRows>();
		for (const cityRow of cityRows) {
			const grouped = citiesByNewsId.get(cityRow.news_id) ?? [];
			grouped.push(cityRow);
			citiesByNewsId.set(cityRow.news_id, grouped);
		}

		const relationsByNewsId = new Map<number, typeof relationRows>();
		for (const relationRow of relationRows) {
			const grouped = relationsByNewsId.get(relationRow.news_id) ?? [];
			grouped.push(relationRow);
			relationsByNewsId.set(relationRow.news_id, grouped);
		}

		const items = newsRows.map((row) => ({
			...row,
			cities: (citiesByNewsId.get(row.id) ?? []).map((cityRow) => ({
				city_id: cityRow.city_id,
				city: cityRow.city,
				country: cityRow.country,
				latitude: cityRow.latitude,
				longitude: cityRow.longitude
			})),
			relationships: (relationsByNewsId.get(row.id) ?? []).map((relationRow) => ({
				from_city_id: relationRow.from_city_id,
				to_city_id: relationRow.to_city_id,
				relation_type: relationRow.relation_type as RelationType,
				relation_note: relationRow.relation_note
			}))
		}));

		return json({
			items,
			polled_at: new Date().toISOString(),
			window_start: start.toISOString(),
			window_end: end.toISOString(),
			min_published_time: bounds.min?.toISOString() ?? null,
			max_published_time: bounds.max?.toISOString() ?? null,
			page: 1,
			page_size: items.length,
			total_items: totalItems,
			total_pages: 1
		});
	} catch (error) {
		console.error('news query failed', error);
		return json(
			{
				items: [],
				polled_at: new Date().toISOString(),
				window_start: null,
				window_end: null,
				min_published_time: null,
				max_published_time: null,
				error: 'Unable to fetch news from postgres',
				page: 1,
				page_size: 0,
				total_items: 0,
				total_pages: 1
			},
			{ status: 500 }
		);
	}
};
