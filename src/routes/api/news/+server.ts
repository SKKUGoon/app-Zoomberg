import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { and, count, desc, eq, gte, isNotNull } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { dimCity, factNews } from '$lib/server/db/schema';

const WINDOW_HOURS = 24;

export const GET: RequestHandler = async () => {
	try {
		const coordinateFilter = and(isNotNull(dimCity.latitude), isNotNull(dimCity.longitude));
		const publishedAfter = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);
		const whereFilter = and(coordinateFilter, gte(factNews.timePublished, publishedAfter));

		const [{ totalItems }] = await db
			.select({ totalItems: count(factNews.id) })
			.from(factNews)
			.innerJoin(dimCity, eq(dimCity.cityId, factNews.cityId))
			.where(whereFilter);

		const rows = await db
			.select({
				id: factNews.id,
				rss_item_id: factNews.rssItemId,
				source: factNews.source,
				source_title: factNews.sourceTitle,
				source_link: factNews.sourceLink,
				summary: factNews.summary,
				time_published: factNews.timePublished,
				city_id: factNews.cityId,
				city: dimCity.city,
				country: dimCity.country,
				latitude: dimCity.latitude,
				longitude: dimCity.longitude,
				keyword_theme_upper: factNews.keywordThemeUpper,
				keyword_theme_lower: factNews.keywordThemeLower,
				keyword_action_upper: factNews.keywordActionUpper,
				keyword_action_lower: factNews.keywordActionLower,
				created_at: factNews.createdAt,
				updated_at: factNews.updatedAt
			})
			.from(factNews)
			.innerJoin(dimCity, eq(dimCity.cityId, factNews.cityId))
			.where(whereFilter)
			.orderBy(desc(factNews.timePublished));

		return json({
			items: rows,
			polled_at: new Date().toISOString(),
			page: 1,
			page_size: rows.length,
			total_items: totalItems,
			total_pages: 1
		});
	} catch (error) {
		console.error('news query failed', error);
		return json(
			{
				items: [],
				polled_at: new Date().toISOString(),
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
