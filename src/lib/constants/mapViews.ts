export type MapViewKey = 'global' | 'korea_estate' | 'tokyo_estate';

export type MapView = {
	key: MapViewKey;
	label: string;
	href: `/map/${MapViewKey}`;
};

export const MAP_VIEWS: MapView[] = [
	{ key: 'global', label: 'Global Context', href: '/map/global' },
	{ key: 'korea_estate', label: 'South Korea Real Estate (WIP)', href: '/map/korea_estate' },
	{ key: 'tokyo_estate', label: 'Tokyo Real Estate (WIP)', href: '/map/tokyo_estate' }
];

export const MAP_NAV_CHILDREN = MAP_VIEWS.map((view) => ({
	label: view.label,
	href: view.href
}));
