import { doublePrecision, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const mart = pgSchema('mart');

export const dimCity = mart.table('dim__city', {
	cityId: uuid('city_id').primaryKey(),
	country: text('country').notNull(),
	city: text('city').notNull(),
	cityAscii: text('city_ascii'),
	latitude: doublePrecision('latitude'),
	longitude: doublePrecision('longitude'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
});

export const factNews = mart.table('fact__news', {
	id: uuid('id').primaryKey(),
	rssItemId: uuid('rss_item_id').notNull(),
	source: text('source').notNull(),
	sourceTitle: text('source_title').notNull(),
	sourceLink: text('source_link').notNull(),
	summary: text('summary'),
	timePublished: timestamp('time_published', { withTimezone: true }).notNull(),
	cityId: uuid('city_id'),
	keywordThemeUpper: text('keyword_theme_upper').notNull(),
	keywordThemeLower: text('keyword_theme_lower').notNull(),
	keywordActionUpper: text('keyword_action_upper').notNull(),
	keywordActionLower: text('keyword_action_lower').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull()
});
