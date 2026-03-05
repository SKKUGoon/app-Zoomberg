export const HOVER_SHOW_DELAY_MS = 180;
export const HOVER_HIDE_DELAY_MS = 120;

export const MIN_ZOOM = 2.6;
export const MAX_ZOOM = 6;
export const ZOOM_HEIGHT_SCALE = 70_000_000;

export const SIDEBAR_COMPENSATION_FACTOR = 0.38;
export const SIDEBAR_COMPENSATION_MIN_METERS = 120_000;
export const SIDEBAR_COMPENSATION_MAX_METERS = 560_000;

export const POPUP_LAYOUT = {
	padding: 12,
	anchorGap: 20,
	minWidth: 280,
	maxWidth: 420,
	widthViewportRatio: 0.34,
	minHeight: 260,
	maxHeight: 380,
	heightViewportRatio: 0.34,
	verticalAnchorRatio: 0.46
} as const;
