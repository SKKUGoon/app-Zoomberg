export const longitudeOffsetFromMeters = (meters: number, latitude: number) => {
	const metersPerDegreeLon = Math.max(22_264, 111_320 * Math.cos((latitude * Math.PI) / 180));
	return meters / metersPerDegreeLon;
};

export const approximateZoomFromHeight = (heightMeters: number, zoomHeightScale: number) =>
	Math.max(0, Math.log2(zoomHeightScale / heightMeters));

export const heightFromApproximateZoom = (zoom: number, zoomHeightScale: number) => zoomHeightScale / 2 ** zoom;
