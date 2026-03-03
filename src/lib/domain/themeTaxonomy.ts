const normalizeThemeLabel = (themeLabel: string) => themeLabel.toLowerCase();

export const CURRENCY_GREEN = '#38b26d';
export const CURRENCY_GREEN_SELECTED = '#6fe59a';
export const DEVELOPED_STOCKS_BLUE = '#4d96ff';
export const DEVELOPED_STOCKS_BLUE_SELECTED = '#8bbcff';
export const EMERGING_STOCKS_ORANGE = '#f29f38';
export const EMERGING_STOCKS_ORANGE_SELECTED = '#ffc06f';

const DEFAULT_THEME_PALETTE = ['#ff7f50', '#53d2dc', '#f7a437', '#8ddf77', '#f67dc0', '#8ea4ff', '#ffd166'];

export const colorForTheme = (theme: string, palette: string[] = DEFAULT_THEME_PALETTE) => {
	let hash = 0;
	for (let i = 0; i < theme.length; i += 1) {
		hash = (hash * 31 + theme.charCodeAt(i)) >>> 0;
	}

	return palette[hash % palette.length];
};

export const isOilAssetTheme = (themeLabel: string) => {
	const normalized = normalizeThemeLabel(themeLabel);
	return normalized.includes('asset(oil)') || (normalized.includes('asset') && normalized.includes('oil'));
};

export const isCurrencyAssetTheme = (themeLabel: string) => {
	const normalized = normalizeThemeLabel(themeLabel);
	return normalized.includes('asset(currency)') || (normalized.includes('asset') && normalized.includes('currency'));
};

export const isDevelopedStocksTheme = (themeLabel: string) => {
	const normalized = normalizeThemeLabel(themeLabel);
	return normalized.includes('asset(developed market stocks)');
};

export const isEmergingStocksTheme = (themeLabel: string) => {
	const normalized = normalizeThemeLabel(themeLabel);
	return normalized.includes('asset(emerging market stocks)');
};

export const isRealEstateTheme = (themeLabel: string) => {
	const normalized = normalizeThemeLabel(themeLabel);
	return normalized.includes('asset(real estate)');
};

export const isPolicyTheme = (themeLabel: string) => {
	const normalized = normalizeThemeLabel(themeLabel);
	return normalized.startsWith('policy') || normalized.includes('policy(');
};

export const isBondTheme = (themeLabel: string) => {
	const normalized = normalizeThemeLabel(themeLabel);
	return normalized.includes('asset(bond)') || (normalized.includes('asset') && normalized.includes('bond'));
};

export const isCommodityTheme = (themeLabel: string) => {
	const normalized = normalizeThemeLabel(themeLabel);
	return normalized.includes('asset(commodity)') || (normalized.includes('asset') && normalized.includes('commodity'));
};

export const isEventsTheme = (themeLabel: string) => {
	const normalized = normalizeThemeLabel(themeLabel);
	return normalized.startsWith('events') || normalized.includes('events(') || normalized.includes('event(');
};

export const isGoldTheme = (themeLabel: string) => {
	const normalized = normalizeThemeLabel(themeLabel);
	return normalized.includes('asset(gold)') || (normalized.includes('asset') && normalized.includes('gold'));
};
