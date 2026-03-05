<script lang="ts">
	import MarkerInfoHoverPanel from '$lib/components/MarkerInfoHoverPanel.svelte';
	import type { MapMarker } from '$lib/types/news';

	let {
		marker,
		placement,
		styleText
	} = $props<{
		marker: MapMarker | null;
		placement: 'left' | 'right';
		styleText: string;
	}>();
</script>

{#if marker}
	<div class={`globe-popup globe-popup-${placement}`} style={styleText}>
		<MarkerInfoHoverPanel {marker} />
	</div>
{/if}

<style>
	.globe-popup {
		position: absolute;
		width: clamp(17.5rem, 34vw, 26.25rem);
		max-height: min(23.75rem, 72vh);
		overflow: hidden;
		padding: 0.65rem 0.75rem;
		border: 1px solid #2a3645;
		border-radius: 0.5rem;
		background: linear-gradient(160deg, #0a1119ed, #0f1924de);
		box-shadow: 0 10px 28px #00000090;
		color: #dde8f6;
		z-index: 620;
		transform: translateZ(0);
		transition: opacity 140ms ease;
	}

	.globe-popup-right {
		border-left: 2px solid #2f6d9f;
	}

	.globe-popup-left {
		border-right: 2px solid #2f6d9f;
	}

	@media (max-width: 1040px) {
		.globe-popup {
			width: min(21rem, 54vw);
		}
	}

	@media (max-width: 680px) {
		.globe-popup {
			width: min(86vw, 20rem);
			max-height: min(60vh, 19rem);
		}
	}
</style>
