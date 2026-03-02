import { bigint, doublePrecision, jsonb, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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

export const factDistilledNews = mart.table('fact__distilled_news', {
	id: bigint('id', { mode: 'number' }).primaryKey(),
	rssItemId: uuid('rss_item_id').notNull(),
	source: text('source').notNull(),
	sourceTitle: text('source_title').notNull(),
	sourceLink: text('source_link').notNull(),
	summary: text('summary').notNull(),
	llmModel: text('llm_model').notNull(),
	gatekeeperReason: text('gatekeeper_reason'),
	agentTrace: jsonb('agent_trace'),
	timePublished: timestamp('time_published', { withTimezone: true }).notNull(),
	keywordThemeUpper: text('keyword_theme_upper').notNull(),
	keywordThemeLower: text('keyword_theme_lower').notNull(),
	processedAt: timestamp('processed_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull()
});

export const mapNewsCities = mart.table('map__news_cities', {
	id: bigint('id', { mode: 'number' }).primaryKey(),
	newsId: bigint('news_id', { mode: 'number' }).notNull(),
	cityId: uuid('city_id').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
});

export const mapNewsRelationship = mart.table('map__news_relationship', {
	id: bigint('id', { mode: 'number' }).primaryKey(),
	newsId: bigint('news_id', { mode: 'number' }).notNull(),
	fromCityId: uuid('from_city_id').notNull(),
	toCityId: uuid('to_city_id').notNull(),
	relationType: text('relation_type').notNull(),
	relationNote: text('relation_note'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull()
});
