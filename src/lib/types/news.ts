export type NewsPayload = {
	items: NewsCard[];
	polled_at: string;
	window_start: string | null;
	window_end: string | null;
	min_published_time: string | null;
	page: number;
	page_size: number;
	total_items: number;
	total_pages: number;
	error?: string;
};

export type ThemeSegment = {
	color: string;
	weight: number;
	label: string;
};

export type MapMarker = {
	id: string;
	cityId: string;
	latitude: number;
	longitude: number;
	title: string;
	detail: string;
	total: number;
	segments: ThemeSegment[];
	wordCloud: Array<{ word: string; weight: number }>;
	articleIds: string[];
};

export type NewsCity = {
	city_id: string;
	city: string;
	country: string;
	latitude: number | null;
	longitude: number | null;
};

export type NewsRelationship = {
	from_city_id: string;
	to_city_id: string;
	relation_type: 'Assault' | 'Cooperate' | 'Independent';
	relation_note: string | null;
};

export type GlobeRelationshipOverlay = {
	highlights: Array<{
		cityId: string;
		latitude: number;
		longitude: number;
		color: string;
	}>;
	links: Array<{
		fromCityId: string;
		toCityId: string;
		fromLatitude: number;
		fromLongitude: number;
		toLatitude: number;
		toLongitude: number;
		color: string;
	}>;
};

export type GlobeFocusTarget = {
	mode: 'point' | 'bounds';
	latitude?: number;
	longitude?: number;
	coordinates?: Array<{
		latitude: number;
		longitude: number;
	}>;
};

export type NewsCard = {
	id: number;
	rss_item_id: string;
	source: string;
	source_title: string;
	source_link: string;
	summary: string | null;
	time_published: string;
	cities: NewsCity[];
	relationships: NewsRelationship[];
	keyword_theme_upper: string;
	keyword_theme_lower: string;
	llm_model: string;
	gatekeeper_reason: string | null;
	created_at: string;
	updated_at: string;
};
