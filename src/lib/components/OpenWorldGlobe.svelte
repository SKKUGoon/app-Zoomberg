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
	import GlobeErrorToast from '$lib/components/map/GlobeErrorToast.svelte';
	import GlobeHoverPopup from '$lib/components/map/GlobeHoverPopup.svelte';
	import {
		HOVER_HIDE_DELAY_MS,
		HOVER_SHOW_DELAY_MS,
		MAX_ZOOM,
		MIN_ZOOM,
		POPUP_LAYOUT,
		SIDEBAR_COMPENSATION_FACTOR,
		SIDEBAR_COMPENSATION_MAX_METERS,
		SIDEBAR_COMPENSATION_MIN_METERS,
		ZOOM_HEIGHT_SCALE
	} from '$lib/constants/globe';
	import {
		getMarkerThemeFlags,
		markerColorHex,
		markerIconDataUrl,
		markerSize
	} from '$lib/domain/globe/markerStyling';
	import {
		approximateZoomFromHeight,
		heightFromApproximateZoom,
		longitudeOffsetFromMeters
	} from '$lib/domain/globe/camera';
	import type { GlobeFocusTarget, GlobeRelationshipOverlay, MapMarker } from '$lib/types/news';

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
		newsRelationshipOverlay?: GlobeRelationshipOverlay | null;
		newsFocusTarget?: GlobeFocusTarget | null;
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
	let hoveredMarkerId = $state<string | null>(null);
	let loadError = $state('');
	let popupPlacement = $state<'left' | 'right'>('right');
	let popupStyle = $state('opacity: 0; pointer-events: none;');
	let hoverShowTimer: number | null = null;
	let hoverHideTimer: number | null = null;

	const relationGlowColorForMarker = (marker: MapMarker): string | null => {
		if (!newsRelationshipOverlay || !marker.cityId) {
			return null;
		}
		const highlight = newsRelationshipOverlay.highlights.find(
			(entry: GlobeRelationshipOverlay['highlights'][number]) => entry.cityId === marker.cityId
		);
		return highlight?.color ?? null;
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

	const clearHoverTimers = () => {
		if (hoverShowTimer !== null) {
			window.clearTimeout(hoverShowTimer);
			hoverShowTimer = null;
		}
		if (hoverHideTimer !== null) {
			window.clearTimeout(hoverHideTimer);
			hoverHideTimer = null;
		}
	};

	const scheduleHoveredMarker = (nextHoveredId: string | null) => {
		if (!viewer) {
			return;
		}

		if (nextHoveredId) {
			if (hoverHideTimer !== null) {
				window.clearTimeout(hoverHideTimer);
				hoverHideTimer = null;
			}

			if (hoveredMarkerId === nextHoveredId) {
				if (hoverShowTimer !== null) {
					window.clearTimeout(hoverShowTimer);
					hoverShowTimer = null;
				}
				return;
			}

			if (hoverShowTimer !== null) {
				window.clearTimeout(hoverShowTimer);
			}
			hoverShowTimer = window.setTimeout(() => {
				hoveredMarkerId = nextHoveredId;
				hoverShowTimer = null;
				updatePopupAnchor();
				viewer?.scene.requestRender();
			}, HOVER_SHOW_DELAY_MS);
			return;
		}

		if (hoverShowTimer !== null) {
			window.clearTimeout(hoverShowTimer);
			hoverShowTimer = null;
		}
		if (hoveredMarkerId === null) {
			return;
		}
		if (hoverHideTimer !== null) {
			window.clearTimeout(hoverHideTimer);
		}
		hoverHideTimer = window.setTimeout(() => {
			hoveredMarkerId = null;
			hoverHideTimer = null;
			updatePopupAnchor();
			viewer?.scene.requestRender();
		}, HOVER_HIDE_DELAY_MS);
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
			const midLongitude = (link.fromLongitude + link.toLongitude) / 2;
			const midLatitude = (link.fromLatitude + link.toLatitude) / 2;
			const noteLabel = link.relationNote ? link.relationNote : `${link.relationType}`;
			const linePositions = cesium.Cartesian3.fromDegreesArray([
				link.fromLongitude,
				link.fromLatitude,
				link.toLongitude,
				link.toLatitude
			]);
			const lineColor = cesium.Color.fromCssColorString(link.color);

			const glowArc = viewer.entities.add({
				polyline: {
					positions: linePositions,
					width: 10,
					arcType: cesium.ArcType.GEODESIC,
					material: lineColor.withAlpha(0.3)
				}
			});
			relationshipEntities.set(`link-glow:${link.fromCityId}:${link.toCityId}:${link.color}`, glowArc);

			const arc = viewer.entities.add({
				polyline: {
					positions: linePositions,
					width: 5,
					arcType: cesium.ArcType.GEODESIC,
					material: lineColor.withAlpha(1)
				}
			});
			relationshipEntities.set(`link:${link.fromCityId}:${link.toCityId}:${link.color}`, arc);

			const label = viewer.entities.add({
				position: cesium.Cartesian3.fromDegrees(midLongitude, midLatitude),
				label: {
					text: noteLabel,
					font: '500 11px IBM Plex Sans',
					fillColor: cesium.Color.fromCssColorString('#dce8f6'),
					outlineColor: cesium.Color.fromCssColorString('#0a1018').withAlpha(0.95),
					outlineWidth: 2,
					style: cesium.LabelStyle.FILL_AND_OUTLINE,
					showBackground: true,
					backgroundColor: cesium.Color.fromCssColorString('#0a1119').withAlpha(0.72),
					backgroundPadding: new cesium.Cartesian2(7, 4),
					horizontalOrigin: cesium.HorizontalOrigin.CENTER,
					verticalOrigin: cesium.VerticalOrigin.BOTTOM,
					disableDepthTestDistance: Number.POSITIVE_INFINITY,
					heightReference: cesium.HeightReference.NONE,
					pixelOffset: new cesium.Cartesian2(0, -4)
				}
			});
			relationshipEntities.set(`link-label:${link.fromCityId}:${link.toCityId}:${link.color}`, label);
		}

		viewer.scene.requestRender();
	};

	const focusCoordinates = (focusTarget: GlobeFocusTarget) => {
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

		const targetHeight = heightFromApproximateZoom(MAX_ZOOM, ZOOM_HEIGHT_SCALE);
		const offsetMeters = Math.max(
			SIDEBAR_COMPENSATION_MIN_METERS,
			Math.min(SIDEBAR_COMPENSATION_MAX_METERS, targetHeight * SIDEBAR_COMPENSATION_FACTOR)
		);
		const offsetLongitude =
			focusTarget.longitude + longitudeOffsetFromMeters(offsetMeters, focusTarget.latitude);
		viewer.camera.flyTo({
			destination: cesium.Cartesian3.fromDegrees(offsetLongitude, focusTarget.latitude, targetHeight),
			duration: 1.05
		});
	};

	const updatePopupAnchor = () => {
		if (!viewer || !cesium || !hoveredMarker) {
			popupStyle = 'opacity: 0; pointer-events: none;';
			return;
		}

		const markerPosition = cesium.Cartesian3.fromDegrees(hoveredMarker.longitude, hoveredMarker.latitude);
		const screenPoint = cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, markerPosition);
		if (!screenPoint) {
			popupStyle = 'opacity: 0; pointer-events: none;';
			return;
		}

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const padding = POPUP_LAYOUT.padding;
		const panelWidth = Math.min(
			POPUP_LAYOUT.maxWidth,
			Math.max(POPUP_LAYOUT.minWidth, viewportWidth * POPUP_LAYOUT.widthViewportRatio)
		);
		const panelHeight = Math.min(
			POPUP_LAYOUT.maxHeight,
			Math.max(POPUP_LAYOUT.minHeight, viewportHeight * POPUP_LAYOUT.heightViewportRatio)
		);
		const anchorGap = POPUP_LAYOUT.anchorGap;

		let placement: 'left' | 'right' = 'right';
		let left = screenPoint.x + anchorGap;
		if (left + panelWidth > viewportWidth - padding) {
			placement = 'left';
			left = screenPoint.x - panelWidth - anchorGap;
		}

		left = Math.max(padding, Math.min(viewportWidth - panelWidth - padding, left));
		const top = Math.max(
			padding,
			Math.min(
				viewportHeight - panelHeight - padding,
				screenPoint.y - panelHeight * POPUP_LAYOUT.verticalAnchorRatio
			)
		);

		popupPlacement = placement;
		popupStyle = `left: ${Math.round(left)}px; top: ${Math.round(top)}px; opacity: 1; pointer-events: none;`;
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
			const dominantTheme = marker.segments[0]?.label ?? '';
			const flags = getMarkerThemeFlags(dominantTheme);
			const baseColor = toColor(colorHex, '#f2a93b') ?? cesium.Color.ORANGE;
			const activeColor = cesium.Color.fromCssColorString('#f7bf66');
			const isActive = marker.id === selectedMarkerId;
			const themedMarkerColorHex = markerColorHex(flags, isActive, colorHex);
			const glowColor = relationGlowColorForMarker(marker);
			const iconSize = Math.round(markerSize(marker.total) + 12);

			const entity = viewer.entities.add({
				position: cesium.Cartesian3.fromDegrees(marker.longitude, marker.latitude),
				point: flags.useAnyIcon
					? undefined
					: {
							pixelSize: markerSize(marker.total),
							color: isActive ? activeColor : baseColor,
							outlineColor: cesium.Color.fromCssColorString('#0a0e13'),
							outlineWidth: isActive ? 2.4 : 1.4
						},
				billboard: flags.useAnyIcon
					? {
							image: markerIconDataUrl(flags, themedMarkerColorHex, glowColor),
							width: iconSize,
							height: iconSize,
							verticalOrigin: cesium.VerticalOrigin.CENTER
						}
					: undefined,
				properties: {
					markerId: marker.id
				}
			});

			markerEntities.set(marker.id, entity);
		}

		syncSelection();
		updatePopupAnchor();
		viewer.scene.requestRender();
	};

	const syncSelection = () => {
		if (!viewer || !cesium) {
			return;
		}

		for (const marker of markers) {
			const entity = markerEntities.get(marker.id);
			if (!entity) {
				continue;
			}
			const isActive = marker.id === selectedMarkerId;
			const dominantTheme = marker.segments[0]?.label ?? '';
			const flags = getMarkerThemeFlags(dominantTheme);
			const glowColor = relationGlowColorForMarker(marker);

			if (flags.useAnyIcon && entity.billboard) {
				const themedMarkerColorHex = markerColorHex(
					flags,
					isActive,
					marker.segments[0]?.color ?? '#f2a93b'
				);
				entity.billboard.image = new cesium.ConstantProperty(
					markerIconDataUrl(flags, themedMarkerColorHex, glowColor)
				);
				continue;
			}

			if (!entity.point) {
				continue;
			}

			entity.point.color = new cesium.ConstantProperty(
				isActive
					? cesium.Color.fromCssColorString('#f7bf66')
					: toColor(marker.segments[0]?.color ?? '#f2a93b', '#f2a93b') ?? cesium.Color.ORANGE
			);
			entity.point.outlineColor = new cesium.ConstantProperty(
				toColor(glowColor ?? '#0a0e13', '#0a0e13') ?? cesium.Color.fromCssColorString('#0a0e13')
			);
			entity.point.outlineWidth = new cesium.ConstantProperty(glowColor ? 4 : isActive ? 2.4 : 1.4);
		}

		if (!selectedMarkerId) {
			viewer.selectedEntity = undefined;
		}

		updatePopupAnchor();
		viewer.scene.requestRender();
	};

	const hoveredMarker = $derived(markers.find((marker: MapMarker) => marker.id === hoveredMarkerId) ?? null);

	$effect(() => {
		void markers;
		renderMarkers();
	});

	$effect(() => {
		void selectedMarkerId;
		syncSelection();
		window.setTimeout(() => updatePopupAnchor(), 0);
	});

	$effect(() => {
		void newsRelationshipOverlay;
		renderRelationshipOverlay();
		syncSelection();
	});

	$effect(() => {
		if (newsFocusTarget) {
			focusCoordinates(newsFocusTarget);
			window.setTimeout(() => updatePopupAnchor(), 0);
		}
	});

	$effect(() => {
		void hoveredMarker;
		window.setTimeout(() => updatePopupAnchor(), 0);
	});

	onMount(() => {
		let alive = true;
		const onResize = () => {
			if (!viewer) {
				return;
			}
			updatePopupAnchor();
			viewer.scene.requestRender();
		};
		window.addEventListener('resize', onResize);

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
					baseLayer: false,
					baseLayerPicker: false,
					terrainProvider: new c.EllipsoidTerrainProvider(),
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
				referenceLayer.alpha = 0.38;
				referenceLayer.saturation = 0;
				referenceLayer.brightness = 0.68;
				referenceLayer.contrast = 0.82;
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
				viewer.scene.globe.maximumScreenSpaceError = 1;
				viewer.scene.globe.preloadAncestors = true;
				viewer.scene.globe.preloadSiblings = true;
				viewer.scene.globe.loadingDescendantLimit = 64;
				viewer.scene.screenSpaceCameraController.minimumZoomDistance = heightFromApproximateZoom(
					MAX_ZOOM,
					ZOOM_HEIGHT_SCALE
				);
				viewer.scene.screenSpaceCameraController.maximumZoomDistance = heightFromApproximateZoom(
					MIN_ZOOM,
					ZOOM_HEIGHT_SCALE
				);

				viewer.camera.setView({
					destination: c.Cartesian3.fromDegrees(
						12,
						20,
						heightFromApproximateZoom(MIN_ZOOM, ZOOM_HEIGHT_SCALE)
					)
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
					const zoomApprox = approximateZoomFromHeight(height, ZOOM_HEIGHT_SCALE);
					console.info('[sphere-globe] zoom approx:', zoomApprox.toFixed(2), '| camera height (m):', Math.round(height));
					updatePopupAnchor();
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
						onMarkerOpen?.(markerId);
						return;
					}
					onMarkerClose?.();
				}, c.ScreenSpaceEventType.LEFT_CLICK);

				clickHandler.setInputAction((movement: { endPosition: Cartesian2 }) => {
					if (!viewer || !cesium) {
						return;
					}
					const picked = viewer.scene.pick(movement.endPosition);
					const markerId = picked?.id?.properties?.markerId?.getValue?.();
					const nextHoveredId = typeof markerId === 'string' ? markerId : null;
					scheduleHoveredMarker(nextHoveredId);
				}, c.ScreenSpaceEventType.MOUSE_MOVE);

				renderMarkers();
				viewer.scene.requestRender();
			} catch (error) {
				console.error('cesium globe init failed', error);
				loadError = 'Sphere globe failed to initialize.';
			}
		})();

		return () => {
			alive = false;
			clearHoverTimers();
			if (clickHandler) {
				clickHandler.destroy();
			}
			window.removeEventListener('resize', onResize);
			clickHandler = null;
			hoveredMarkerId = null;
			if (viewer && cameraMoveEndHandler) {
				viewer.camera.moveEnd.removeEventListener(cameraMoveEndHandler);
			}
			cameraMoveEndHandler = null;
			clearEntities();
			clearRelationshipEntities();
			if (viewer) {
				viewer.destroy();
			}
			viewer = null;
			cesium = null;
		};
	});
</script>

<div bind:this={globeContainer} class="globe-root" role="img" aria-label="Sphere globe map"></div>

<GlobeHoverPopup marker={hoveredMarker} placement={popupPlacement} styleText={popupStyle} />

<GlobeErrorToast message={loadError} />

<style>
	.globe-root {
		height: 100%;
		width: 100%;
		overflow: hidden;
		background: #000000;
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
