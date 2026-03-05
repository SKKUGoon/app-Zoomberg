import {
	CURRENCY_GREEN,
	CURRENCY_GREEN_SELECTED,
	DEVELOPED_STOCKS_BLUE,
	DEVELOPED_STOCKS_BLUE_SELECTED,
	EMERGING_STOCKS_ORANGE,
	EMERGING_STOCKS_ORANGE_SELECTED,
	isBondTheme,
	isCommodityTheme,
	isCurrencyAssetTheme,
	isDevelopedStocksTheme,
	isEmergingStocksTheme,
	isEventsTheme,
	isGoldTheme,
	isOilAssetTheme,
	isPolicyTheme,
	isRealEstateTheme
} from '$lib/domain/themeTaxonomy';
import { buildIconSvgDataUrl, type GlobeIconKind } from '$lib/domain/globe/icons';

export type MarkerThemeFlags = {
	useOilIcon: boolean;
	useCurrencyIcon: boolean;
	useDevelopedStocksIcon: boolean;
	useEmergingStocksIcon: boolean;
	useRealEstateIcon: boolean;
	usePolicyIcon: boolean;
	useBondIcon: boolean;
	useCommodityIcon: boolean;
	useEventsIcon: boolean;
	useGoldIcon: boolean;
	useStocksIcon: boolean;
	useAnyIcon: boolean;
};

export const markerSize = (count: number) => Math.min(18, 7 + Math.sqrt(Math.max(1, count)) * 2.4);

export const getMarkerThemeFlags = (themeLabel: string): MarkerThemeFlags => {
	const useOilIcon = isOilAssetTheme(themeLabel);
	const useCurrencyIcon = isCurrencyAssetTheme(themeLabel);
	const useDevelopedStocksIcon = isDevelopedStocksTheme(themeLabel);
	const useEmergingStocksIcon = isEmergingStocksTheme(themeLabel);
	const useRealEstateIcon = isRealEstateTheme(themeLabel);
	const usePolicyIcon = isPolicyTheme(themeLabel);
	const useBondIcon = isBondTheme(themeLabel);
	const useCommodityIcon = isCommodityTheme(themeLabel);
	const useEventsIcon = isEventsTheme(themeLabel);
	const useGoldIcon = isGoldTheme(themeLabel);
	const useStocksIcon = useDevelopedStocksIcon || useEmergingStocksIcon;
	const useAnyIcon =
		useOilIcon ||
		useCurrencyIcon ||
		useStocksIcon ||
		useRealEstateIcon ||
		usePolicyIcon ||
		useBondIcon ||
		useCommodityIcon ||
		useEventsIcon ||
		useGoldIcon;

	return {
		useOilIcon,
		useCurrencyIcon,
		useDevelopedStocksIcon,
		useEmergingStocksIcon,
		useRealEstateIcon,
		usePolicyIcon,
		useBondIcon,
		useCommodityIcon,
		useEventsIcon,
		useGoldIcon,
		useStocksIcon,
		useAnyIcon
	};
};

export const markerColorHex = (
	flags: MarkerThemeFlags,
	isActive: boolean,
	baseColorHex: string,
	activeFallbackHex = '#f7bf66'
) => {
	if (flags.useCurrencyIcon) {
		return isActive ? CURRENCY_GREEN_SELECTED : CURRENCY_GREEN;
	}
	if (flags.useDevelopedStocksIcon) {
		return isActive ? DEVELOPED_STOCKS_BLUE_SELECTED : DEVELOPED_STOCKS_BLUE;
	}
	if (flags.useEmergingStocksIcon) {
		return isActive ? EMERGING_STOCKS_ORANGE_SELECTED : EMERGING_STOCKS_ORANGE;
	}
	return isActive ? activeFallbackHex : baseColorHex;
};

const iconKindFromFlags = (flags: MarkerThemeFlags): GlobeIconKind => {
	if (flags.useOilIcon) {
		return 'oil';
	}
	if (flags.useCurrencyIcon) {
		return 'currency';
	}
	if (flags.useStocksIcon) {
		return 'stocks';
	}
	if (flags.useRealEstateIcon) {
		return 'realEstate';
	}
	if (flags.usePolicyIcon) {
		return 'policy';
	}
	if (flags.useBondIcon) {
		return 'bond';
	}
	if (flags.useCommodityIcon) {
		return 'commodity';
	}
	if (flags.useEventsIcon) {
		return 'events';
	}
	return 'gold';
};

export const markerIconDataUrl = (
	flags: MarkerThemeFlags,
	fillColor: string,
	glowColor: string | null
) => buildIconSvgDataUrl(iconKindFromFlags(flags), fillColor, glowColor);
