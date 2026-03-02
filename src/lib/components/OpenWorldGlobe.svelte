<script lang="ts">
	import { onMount } from 'svelte';
	import 'cesium/Build/Cesium/Widgets/widgets.css';
	import type {
		Cartesian2,
		Color,
		Entity,
		ScreenSpaceEventHandler,
		Viewer
	} from 'cesium';

	type MapMarker = {
		id: string;
		latitude: number;
		longitude: number;
		title: string;
		detail: string;
		total: number;
		wordCloud: Array<{
			word: string;
			weight: number;
		}>;
		segments: Array<{
			color: string;
			weight: number;
			label: string;
		}>;
	};

	type NewsRelationshipOverlay = {
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

	type FocusTarget = {
	mode: 'point' | 'bounds';
	latitude?: number;
	longitude?: number;
	coordinates?: Array<{
		latitude: number;
		longitude: number;
	}>;
	};

	type CesiumModule = typeof import('cesium');

	let {
		markers = [],
		selectedMarkerId = null,
		newsRelationshipOverlay = null,
		newsFocusTarget = null,
		onMarkerOpen,
		onMarkerClose
	} = $props<{
		markers?: MapMarker[];
		selectedMarkerId?: string | null;
		newsRelationshipOverlay?: NewsRelationshipOverlay | null;
		newsFocusTarget?: FocusTarget | null;
		onMarkerOpen?: (markerId: string) => void;
		onMarkerClose?: () => void;
	}>();

	let globeContainer: HTMLDivElement;
	let cesium: CesiumModule | null = null;
	let viewer: Viewer | null = null;
	let clickHandler: ScreenSpaceEventHandler | null = null;
	let cameraMoveEndHandler: (() => void) | null = null;
	const markerEntities = new Map<string, Entity>();
	const relationshipEntities = new Map<string, Entity>();
	let echartsModule: typeof import('echarts') | null = null;
	let wordCloudReady = $state(false);
	let popupCloudContainer = $state<HTMLDivElement | null>(null);
	let popupCloudChart: import('echarts').ECharts | null = null;
	let loadError = $state('');
	const MIN_ZOOM = 2.6;
	const MAX_ZOOM = 6;
	const ZOOM_HEIGHT_SCALE = 70_000_000;
	const SIDEBAR_COMPENSATION_FACTOR = 0.28;
	const SIDEBAR_COMPENSATION_MIN_METERS = 120_000;
	const SIDEBAR_COMPENSATION_MAX_METERS = 420_000;

	const longitudeOffsetFromMeters = (meters: number, latitude: number) => {
		const metersPerDegreeLon = Math.max(22_264, 111_320 * Math.cos((latitude * Math.PI) / 180));
		return meters / metersPerDegreeLon;
	};

	const markerSize = (count: number) => Math.min(18, 7 + Math.sqrt(Math.max(1, count)) * 2.4);

	const markerTooltip = (marker: MapMarker) => {
		const parts = marker.segments
			.slice(0, 4)
			.map((segment) => `${segment.label}: ${segment.weight}`)
			.join(' | ');
		return parts.length > 0 ? `Theme mix: ${parts}` : 'Theme mix: n/a';
	};

	const toColor = (value: string, fallback: string): Color | null => {
		if (!cesium) {
			return null;
		}
		try {
			return cesium.Color.fromCssColorString(value);
		} catch {
			return cesium.Color.fromCssColorString(fallback);
		}
	};

	const clearEntities = () => {
		if (!viewer) {
			return;
		}
		for (const entity of markerEntities.values()) {
			viewer.entities.remove(entity);
		}
		markerEntities.clear();
	};

	const clearRelationshipEntities = () => {
		if (!viewer) {
			return;
		}
		for (const entity of relationshipEntities.values()) {
			viewer.entities.remove(entity);
		}
		relationshipEntities.clear();
	};

	const renderRelationshipOverlay = () => {
		if (!viewer || !cesium) {
			return;
		}

		clearRelationshipEntities();
		if (!newsRelationshipOverlay) {
			viewer.scene.requestRender();
			return;
		}

		for (const highlight of newsRelationshipOverlay.highlights) {
			const marker = viewer.entities.add({
				position: cesium.Cartesian3.fromDegrees(highlight.longitude, highlight.latitude),
				point: {
					pixelSize: 13,
					color: cesium.Color.fromCssColorString(highlight.color).withAlpha(0.9),
					outlineColor: cesium.Color.fromCssColorString(highlight.color).withAlpha(0.38),
					outlineWidth: 7
				}
			});
			relationshipEntities.set(`highlight:${highlight.cityId}:${highlight.color}`, marker);
		}

		for (const link of newsRelationshipOverlay.links) {
			const arc = viewer.entities.add({
				polyline: {
					positions: cesium.Cartesian3.fromDegreesArray([
						link.fromLongitude,
						link.fromLatitude,
						link.toLongitude,
						link.toLatitude
					]),
					width: 3,
					arcType: cesium.ArcType.GEODESIC,
					material: new cesium.PolylineGlowMaterialProperty({
						glowPower: 0.22,
						taperPower: 0.62,
						color: cesium.Color.fromCssColorString(link.color).withAlpha(0.95)
					})
				}
			});
			relationshipEntities.set(`link:${link.fromCityId}:${link.toCityId}:${link.color}`, arc);
		}

		viewer.scene.requestRender();
	};

	const focusMarker = (markerId: string) => {
		if (!viewer || !cesium) {
			return;
		}
		const marker = markers.find((entry: MapMarker) => entry.id === markerId);
		if (!marker) {
			return;
		}
		const targetHeight = ZOOM_HEIGHT_SCALE / 2 ** MAX_ZOOM;
		const offsetMeters = Math.max(
			SIDEBAR_COMPENSATION_MIN_METERS,
			Math.min(SIDEBAR_COMPENSATION_MAX_METERS, targetHeight * SIDEBAR_COMPENSATION_FACTOR)
		);
		// Shift camera target east so marker lands left-of-center under the right-side panel.
		const offsetLongitude = marker.longitude + longitudeOffsetFromMeters(offsetMeters, marker.latitude);
		viewer.camera.flyTo({
			destination: cesium.Cartesian3.fromDegrees(offsetLongitude, marker.latitude, targetHeight),
			duration: 1.05
		});
	};

	const focusCoordinates = (focusTarget: FocusTarget) => {
		if (!viewer || !cesium) {
			return;
		}

	if (focusTarget.mode === 'bounds') {
		const points = focusTarget.coordinates ?? [];
		if (points.length === 0) {
			return;
		}

		const latitudes = points.map((point) => point.latitude);
		const longitudes = points.map((point) => point.longitude);
		const south = Math.max(-85, Math.min(...latitudes) - 10);
		const north = Math.min(85, Math.max(...latitudes) + 10);
		const west = Math.max(-179, Math.min(...longitudes) - 14);
		const east = Math.min(179, Math.max(...longitudes) + 14);

		viewer.camera.flyTo({
			destination: cesium.Rectangle.fromDegrees(west, south, east, north),
			duration: 1.2
		});
		return;
	}

	if (
		focusTarget.mode !== 'point' ||
		typeof focusTarget.latitude !== 'number' ||
		typeof focusTarget.longitude !== 'number'
	) {
		return;
	}

		const targetHeight = ZOOM_HEIGHT_SCALE / 2 ** MAX_ZOOM;
		const offsetMeters = Math.max(
			SIDEBAR_COMPENSATION_MIN_METERS,
			Math.min(SIDEBAR_COMPENSATION_MAX_METERS, targetHeight * SIDEBAR_COMPENSATION_FACTOR)
		);
	const offsetLongitude = focusTarget.longitude + longitudeOffsetFromMeters(offsetMeters, focusTarget.latitude);
		viewer.camera.flyTo({
		destination: cesium.Cartesian3.fromDegrees(offsetLongitude, focusTarget.latitude, targetHeight),
			duration: 1.05
		});
	};

	const approximateZoomFromHeight = (heightMeters: number) => Math.max(0, Math.log2(ZOOM_HEIGHT_SCALE / heightMeters));
	const heightFromApproximateZoom = (zoom: number) => ZOOM_HEIGHT_SCALE / 2 ** zoom;
	const colorForWordRatio = (ratio: number) => {
		const clamped = Math.min(1, Math.max(0, ratio));
		const channel = Math.round(148 + clamped * 107);
		const hex = channel.toString(16).padStart(2, '0');
		return `#${hex}${hex}${hex}`;
	};

	const disposePopupWordCloud = () => {
		if (popupCloudChart) {
			popupCloudChart.dispose();
			popupCloudChart = null;
		}
	};

	const mountPopupWordCloud = () => {
		if (!wordCloudReady || !echartsModule) {
			return;
		}
		if (!selectedMarker || selectedMarker.wordCloud.length === 0 || !popupCloudContainer) {
			disposePopupWordCloud();
			return;
		}

		disposePopupWordCloud();
		const chart = echartsModule.init(popupCloudContainer, undefined, { renderer: 'canvas' });
		const maxWeight = selectedMarker.wordCloud.reduce((max: number, term: { word: string; weight: number }) => Math.max(max, term.weight), 1);
		const data = selectedMarker.wordCloud.map((term: { word: string; weight: number }) => {
			const ratio = term.weight / maxWeight;
			const fontWeight = ratio > 0.72 ? 800 : ratio > 0.5 ? 700 : 600;
			return {
				name: term.word,
				value: term.weight,
				textStyle: {
					color: colorForWordRatio(ratio),
					fontWeight
				}
			};
		});

		chart.setOption({
			backgroundColor: 'transparent',
			series: [
				{
					type: 'wordCloud',
					shape: 'circle',
					left: 'center',
					top: 'center',
					width: '100%',
					height: '100%',
					gridSize: 5,
					sizeRange: [12, 34],
					rotationRange: [0, 0],
					drawOutOfBound: false,
					layoutAnimation: true,
					textStyle: {
						fontFamily: 'IBM Plex Sans, sans-serif'
					},
					data
				}
			]
		});

		popupCloudChart = chart;
		window.setTimeout(() => popupCloudChart?.resize(), 0);
	};

	const renderMarkers = () => {
		if (!viewer || !cesium) {
			return;
		}

		clearEntities();

		for (const marker of markers) {
			if (!Number.isFinite(marker.latitude) || !Number.isFinite(marker.longitude)) {
				continue;
			}

			const colorHex = marker.segments.length > 0 ? marker.segments[0].color : '#f2a93b';
			const baseColor = toColor(colorHex, '#f2a93b') ?? cesium.Color.ORANGE;
			const activeColor = cesium.Color.fromCssColorString('#f7bf66');

			const entity = viewer.entities.add({
				position: cesium.Cartesian3.fromDegrees(marker.longitude, marker.latitude),
				point: {
					pixelSize: markerSize(marker.total),
					color: marker.id === selectedMarkerId ? activeColor : baseColor,
					outlineColor: cesium.Color.fromCssColorString('#0a0e13'),
					outlineWidth: marker.id === selectedMarkerId ? 2.4 : 1.4
				},
				properties: {
					markerId: marker.id
				}
			});

			markerEntities.set(marker.id, entity);
		}

		syncSelection();
	};

	const syncSelection = () => {
		if (!viewer || !cesium) {
			return;
		}

		for (const marker of markers) {
			const entity = markerEntities.get(marker.id);
			if (!entity || !entity.point) {
				continue;
			}
			const isActive = marker.id === selectedMarkerId;
			entity.point.color = new cesium.ConstantProperty(
				isActive
					? cesium.Color.fromCssColorString('#f7bf66')
					: toColor(marker.segments[0]?.color ?? '#f2a93b', '#f2a93b') ?? cesium.Color.ORANGE
			);
			entity.point.outlineWidth = new cesium.ConstantProperty(isActive ? 2.4 : 1.4);
		}

		if (!selectedMarkerId) {
			viewer.selectedEntity = undefined;
		}
	};

	const selectedMarker = $derived(markers.find((marker: MapMarker) => marker.id === selectedMarkerId) ?? null);

	$effect(() => {
		void markers.length;
		renderMarkers();
	});

	$effect(() => {
		void selectedMarkerId;
		syncSelection();
		if (selectedMarkerId) {
			focusMarker(selectedMarkerId);
		}
		window.setTimeout(() => mountPopupWordCloud(), 0);
	});

	$effect(() => {
		void newsRelationshipOverlay;
		renderRelationshipOverlay();
	});

	$effect(() => {
		if (newsFocusTarget) {
			focusCoordinates(newsFocusTarget);
		}
	});

	$effect(() => {
		void wordCloudReady;
		window.setTimeout(() => mountPopupWordCloud(), 0);
	});

	onMount(() => {
		let alive = true;

		void (async () => {
			try {
				const c = await import('cesium');
				if (!alive) {
					return;
				}
				cesium = c;
				c.Ion.defaultAccessToken = '';

				viewer = new c.Viewer(globeContainer, {
					animation: false,
					timeline: false,
					baseLayerPicker: false,
					fullscreenButton: false,
					homeButton: false,
					sceneModePicker: false,
					navigationHelpButton: false,
					geocoder: false,
					infoBox: false,
					selectionIndicator: false
				});

				viewer.imageryLayers.removeAll();
				const baseMapLayer = viewer.imageryLayers.addImageryProvider(
					new c.UrlTemplateImageryProvider({
						url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
						credit: '&copy; Esri'
					})
				);
				const referenceLayer = viewer.imageryLayers.addImageryProvider(
					new c.UrlTemplateImageryProvider({
						url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
						credit: '&copy; Esri'
					})
				);
				baseMapLayer.alpha = 0.78;
				baseMapLayer.saturation = 0.08;
				baseMapLayer.brightness = 0.46;
				baseMapLayer.contrast = 1.08;
				// Tile labels can't be truly resized, so reduce prominence to read ~smaller.
				referenceLayer.alpha = 0.38;
				referenceLayer.saturation = 0;
				referenceLayer.brightness = 0.68;
				referenceLayer.contrast = 0.82;
				// Keep the sphere very dark while preserving map context.
				viewer.scene.globe.baseColor = c.Color.fromCssColorString('#0a0f15');
				viewer.scene.globe.enableLighting = false;
				viewer.scene.globe.translucency.enabled = false;
				viewer.scene.globe.showGroundAtmosphere = false;
				if (viewer.scene.skyAtmosphere) {
					viewer.scene.skyAtmosphere.show = false;
				}
				if (viewer.scene.skyBox) {
					viewer.scene.skyBox.show = false;
				}
				if (viewer.scene.sun) {
					viewer.scene.sun.show = false;
				}
				if (viewer.scene.moon) {
					viewer.scene.moon.show = false;
				}
				viewer.scene.fog.enabled = false;
				viewer.scene.backgroundColor = c.Color.fromCssColorString('#000000');
				viewer.scene.highDynamicRange = false;
				viewer.scene.screenSpaceCameraController.enableTilt = false;
				viewer.scene.requestRenderMode = true;
				viewer.scene.maximumRenderTimeChange = Number.POSITIVE_INFINITY;
				viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.15);
				viewer.targetFrameRate = 30;
				// Reduce center-vs-edge tile mismatch by refining more aggressively.
				viewer.scene.globe.maximumScreenSpaceError = 1;
				viewer.scene.globe.preloadAncestors = true;
				viewer.scene.globe.preloadSiblings = true;
				viewer.scene.globe.loadingDescendantLimit = 64;
				viewer.scene.screenSpaceCameraController.minimumZoomDistance = heightFromApproximateZoom(MAX_ZOOM);
				viewer.scene.screenSpaceCameraController.maximumZoomDistance = heightFromApproximateZoom(MIN_ZOOM);

				viewer.camera.setView({
					destination: c.Cartesian3.fromDegrees(12, 20, heightFromApproximateZoom(MIN_ZOOM))
				});
				cameraMoveEndHandler = () => {
					if (!viewer || !cesium) {
						return;
					}
					const cartographic = cesium.Ellipsoid.WGS84.cartesianToCartographic(viewer.camera.position);
					if (!cartographic) {
						return;
					}
					const height = cartographic.height;
					const zoomApprox = approximateZoomFromHeight(height);
					console.info('[sphere-globe] zoom approx:', zoomApprox.toFixed(2), '| camera height (m):', Math.round(height));
					viewer.scene.requestRender();
				};
				viewer.camera.moveEnd.addEventListener(cameraMoveEndHandler);
				cameraMoveEndHandler();

				clickHandler = new c.ScreenSpaceEventHandler(viewer.scene.canvas);
				clickHandler.setInputAction((movement: { position: Cartesian2 }) => {
					if (!viewer || !cesium) {
						return;
					}
					const picked = viewer.scene.pick(movement.position);
					const markerId = picked?.id?.properties?.markerId?.getValue?.();
					if (typeof markerId === 'string') {
						focusMarker(markerId);
						onMarkerOpen?.(markerId);
						return;
					}
					onMarkerClose?.();
				}, c.ScreenSpaceEventType.LEFT_CLICK);

				renderMarkers();
				viewer.scene.requestRender();
			} catch (error) {
				console.error('cesium globe init failed', error);
				loadError = 'Sphere globe failed to initialize.';
			}
		})();

		return () => {
			alive = false;
			if (clickHandler) {
				clickHandler.destroy();
			}
			clickHandler = null;
			if (viewer && cameraMoveEndHandler) {
				viewer.camera.moveEnd.removeEventListener(cameraMoveEndHandler);
			}
			cameraMoveEndHandler = null;
			clearEntities();
			clearRelationshipEntities();
			if (viewer) {
				viewer.destroy();
			}
			disposePopupWordCloud();
			viewer = null;
			cesium = null;
		};
	});

	onMount(() => {
		void (async () => {
			try {
				const echarts = await import('echarts');
				await import('echarts-wordcloud');
				echartsModule = echarts;
				wordCloudReady = true;
				window.setTimeout(() => mountPopupWordCloud(), 0);
			} catch (error) {
				console.error('globe popup wordcloud init failed', error);
			}
		})();

		return () => {
			disposePopupWordCloud();
			echartsModule = null;
			wordCloudReady = false;
		};
	});
</script>

<div bind:this={globeContainer} class="globe-root" role="img" aria-label="Sphere globe map"></div>

{#if false && selectedMarker}
	<div class="globe-popup">
		<p class="popup-title">{selectedMarker.title}</p>
		<p class="popup-detail">{selectedMarker.detail}</p>
		<p class="popup-theme">{markerTooltip(selectedMarker)}</p>
		{#if selectedMarker.wordCloud.length === 0}
			<div class="popup-cloud-empty">No theme terms</div>
		{:else}
			<div bind:this={popupCloudContainer} class="popup-cloud-chart"></div>
		{/if}
		<button type="button" onclick={onMarkerClose}>Clear selection</button>
	</div>
{/if}

{#if loadError}
	<div class="globe-error">{loadError}</div>
{/if}

<style>
	.globe-root {
		height: 100%;
		width: 100%;
		overflow: hidden;
		background: #000000;
	}

	.globe-popup {
		position: absolute;
		right: 1rem;
		top: 5.15rem;
		width: min(38rem, 47vw);
		padding: 0.65rem 0.75rem;
		border: 1px solid #2a3645;
		border-radius: 0.5rem;
		background: linear-gradient(160deg, #0a1119ed, #0f1924de);
		box-shadow: 0 10px 28px #00000090;
		color: #dde8f6;
		z-index: 620;
		pointer-events: auto;
	}

	.popup-title {
		margin: 0;
		color: #f5f8fc;
		font: 700 0.85rem/1.2 'IBM Plex Sans', sans-serif;
	}

	.popup-detail {
		margin: 0.25rem 0 0;
		color: #a9c2dd;
		font-size: 0.76rem;
	}

	.popup-theme {
		margin: 0.25rem 0 0.5rem;
		color: #f3b24f;
		font-size: 0.73rem;
	}

	.popup-cloud-chart {
		margin-top: 0.48rem;
		padding-top: 0.42rem;
		border-top: 1px solid #36516d;
		width: 220px;
		height: 145px;
	}

	.popup-cloud-empty {
		margin-top: 0.48rem;
		padding-top: 0.42rem;
		border-top: 1px solid #36516d;
		color: #b7c6d4;
		font-size: 0.78rem;
	}

	.globe-popup button {
		padding: 0.26rem 0.5rem;
		border: 1px solid #825f2a;
		border-radius: 0.36rem;
		background: #1a2330;
		color: #f3c06d;
		font-size: 0.73rem;
		cursor: pointer;
	}

	.globe-error {
		position: absolute;
		left: 1rem;
		top: 1rem;
		padding: 0.5rem 0.7rem;
		border: 1px solid #6a2f2f;
		background: #1a1010;
		color: #ffb5b5;
		font-size: 0.78rem;
		border-radius: 0.5rem;
		z-index: 650;
	}

	@media (max-width: 1040px) {
		.globe-popup {
			width: min(35rem, 56vw);
		}
	}

	@media (max-width: 680px) {
		.globe-popup {
			top: 8.7rem;
			right: 0.75rem;
			width: min(92vw, 34rem);
		}
	}

	:global(.cesium-viewer-toolbar),
	:global(.cesium-viewer-animationContainer),
	:global(.cesium-viewer-timelineContainer) {
		display: none;
	}

	:global(.cesium-viewer-bottom) {
		background: #090d12cc;
		border-top: 1px solid #222a33;
	}

	:global(.cesium-credit-textContainer),
	:global(.cesium-credit-logoContainer) {
		opacity: 0.82;
	}
</style>
