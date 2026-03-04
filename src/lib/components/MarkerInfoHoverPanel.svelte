<script lang="ts">
	import AreaWordCloud from '$lib/components/AreaWordCloud.svelte';
	import ThemeMixPieChart from '$lib/components/ThemeMixPieChart.svelte';
	import type { MapMarker } from '$lib/types/news';

	let { marker } = $props<{ marker: MapMarker }>();
</script>

<section class="marker-hover-panel" aria-label={`Area information for ${marker.title}`}>
	<h3>{marker.title}</h3>
	<div class="chart-block">
		<p>Theme Mix</p>
		<ThemeMixPieChart
			height={126}
			data={marker.segments.map((segment: { label: string; weight: number }) => ({
				label: segment.label,
				weight: segment.weight
			}))}
		/>
	</div>
	<div class="chart-block">
		<p>Word Cloud</p>
		<AreaWordCloud words={marker.wordCloud} emptyLabel="No summary terms for this area." />
	</div>
</section>

<style>
	.marker-hover-panel {
		pointer-events: none;
		padding: 0.62rem;
		border: 1px solid #2d3e4f;
		border-radius: 0.54rem;
		background: linear-gradient(150deg, #0d131be8, #121c29e6);
		box-shadow: 0 14px 30px #00000080;
		color: #d9e4ef;
		display: grid;
		gap: 0.46rem;
	}

	h3 {
		margin: 0 0 0.52rem;
		font: 700 0.9rem/1.25 'IBM Plex Sans', sans-serif;
		color: #f2f7fc;
	}

	.chart-block {
		margin-top: 0.2rem;
	}

	.chart-block p {
		margin: 0;
		color: #f2b94f;
		font: 600 0.68rem/1.2 'IBM Plex Mono', monospace;
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.chart-block :global(.wordcloud-chart) {
		height: 112px;
		border-top-color: #2f465c;
		margin-top: 0.28rem;
		padding-top: 0.32rem;
	}

	.chart-block :global(.wordcloud-empty) {
		border-top-color: #2f465c;
		margin-top: 0.28rem;
		padding-top: 0.32rem;
	}
</style>
