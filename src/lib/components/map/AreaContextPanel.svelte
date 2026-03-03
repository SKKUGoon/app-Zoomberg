<script lang="ts">
	import AreaWordCloud from '$lib/components/AreaWordCloud.svelte';
	import type { MapMarker } from '$lib/types/news';

	let { marker } = $props<{ marker: MapMarker }>();

	const describeThemeMix = (selectedMarker: MapMarker) => {
		const parts = selectedMarker.segments
			.slice(0, 4)
			.map((segment) => `${segment.label}: ${segment.weight}`)
			.join(' | ');
		return parts.length > 0 ? `Theme mix: ${parts}` : 'Theme mix: n/a';
	};
</script>

<section class="area-overlay">
	<div class="panel-heading">
		<h2>{marker.title}</h2>
		<p>Selected area context and keyword cloud.</p>
	</div>
	<p class="area-detail">{marker.detail}</p>
	<p class="area-theme">{describeThemeMix(marker)}</p>
	<AreaWordCloud words={marker.wordCloud} emptyLabel="No summary terms for this area." />
</section>

<style>
	.area-overlay {
		pointer-events: auto;
		padding: 0.7rem 0.75rem;
		border: 1px solid #f3f6fb1f;
		backdrop-filter: blur(14px);
		background: linear-gradient(145deg, #0c131bc9, #111a25a8);
		box-shadow: 0 16px 40px #02060c88;
		border-radius: 0.8rem;
	}

	.panel-heading h2 {
		margin: 0;
		font: 600 0.95rem/1.2 'IBM Plex Sans', sans-serif;
		color: #f6fbff;
	}

	.panel-heading p {
		margin: 0.24rem 0 0.55rem;
		font: 500 0.72rem/1 'IBM Plex Mono', monospace;
		color: #ffcc7f;
	}

	.area-detail {
		margin: 0.22rem 0 0;
		font-size: 0.75rem;
		color: #a7bfd7;
	}

	.area-theme {
		margin: 0.2rem 0 0.45rem;
		font-size: 0.74rem;
		color: #ffcc7f;
	}

	@media (min-width: 1100px) and (min-height: 700px) and (orientation: landscape) {
		.area-overlay {
			flex: 1 1 0;
			min-height: 11rem;
			overflow: hidden;
		}
	}
</style>
