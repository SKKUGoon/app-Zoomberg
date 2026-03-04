<script lang="ts">
	import ThemeTopicIcon from '$lib/components/ThemeTopicIcon.svelte';

	type MarkerThemeLegendItem = {
		label: string;
		color: string;
		isOil: boolean;
		isCurrency: boolean;
		isDevelopedStocks: boolean;
		isEmergingStocks: boolean;
		isRealEstate: boolean;
		isPolicy: boolean;
		isBond: boolean;
		isCommodity: boolean;
		isEvents: boolean;
		isGold: boolean;
	};

	let { items = [] } = $props<{ items?: MarkerThemeLegendItem[] }>();
	let collapsed = $state(false);
</script>

{#if items.length > 0}
	<section class="map-legend" aria-label="Map marker legend">
		<div class="map-legend-title-row">
			<button
				type="button"
				class="map-legend-toggle"
				aria-expanded={!collapsed}
				aria-label={collapsed ? 'Expand color legend' : 'Collapse color legend'}
				onclick={() => {
					collapsed = !collapsed;
				}}
			>
				{collapsed ? '▸' : '▾'}
			</button>
			<p class="map-legend-title">Color legend</p>
		</div>
		{#if !collapsed}
			<div class="map-legend-list">
				{#each items as item}
					<div class="map-legend-item">
						<ThemeTopicIcon themeLabel={item.label} color={item.color} size={14} />
						<span class="map-legend-label">{item.label}</span>
					</div>
				{/each}
			</div>
		{/if}
	</section>
{/if}

<style>
	.map-legend {
		position: absolute;
		left: 1rem;
		top: calc(var(--globe-banner-offset) + 2.35rem);
		z-index: 520;
		padding: 0.52rem 0.62rem;
		border-radius: 0.56rem;
		border: 1px solid #2f4254;
		background: linear-gradient(160deg, #0b121bcf, #132130b8);
		backdrop-filter: blur(10px);
		box-shadow: 0 10px 26px #01060d88;
		pointer-events: auto;
		max-width: min(21rem, 42vw);
	}

	.map-legend-title-row {
		display: flex;
		align-items: center;
		gap: 0.38rem;
		margin-bottom: 0.34rem;
	}

	.map-legend-title {
		margin: 0;
		font: 600 0.68rem/1 'IBM Plex Mono', monospace;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #dce7f4;
	}

	.map-legend-toggle {
		width: 1rem;
		height: 1rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #3a4b5f;
		border-radius: 0.24rem;
		background: #101923;
		color: #c7d5e4;
		font: 700 0.58rem/1 'IBM Plex Mono', monospace;
		cursor: pointer;
		padding: 0;
	}

	.map-legend-list {
		display: grid;
		gap: 0.26rem;
	}

	.map-legend-item {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-width: 0;
	}

	.map-legend-label {
		font: 500 0.72rem/1.2 'IBM Plex Sans', sans-serif;
		color: #cfddea;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (max-width: 680px) {
		.map-legend {
			left: 0.75rem;
			top: calc(var(--globe-banner-offset) + 2.35rem);
			max-width: min(16rem, 60vw);
		}
	}
</style>
