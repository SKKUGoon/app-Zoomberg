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

	let { items = [], mapContextLabel = 'Global Context' } = $props<{
		items?: MarkerThemeLegendItem[];
		mapContextLabel?: string;
	}>();
	let collapsed = $state(true);
</script>

<section class="map-legend" aria-label="Map context and marker legend" class:expanded={!collapsed}>
	<button
		type="button"
		class="context-pill"
		aria-expanded={!collapsed}
		aria-label={collapsed ? 'Expand global context legend' : 'Collapse global context legend'}
		onclick={() => {
			collapsed = !collapsed;
		}}
	>
		<span>{mapContextLabel}</span>
		<span class="context-pill-arrow">{collapsed ? '▸' : '▾'}</span>
	</button>

	{#if !collapsed}
		<p class="map-legend-title">Relationship lines</p>
		<div class="relation-legend-list">
			<div class="relation-legend-item">
				<span class="relation-line relation-cooperate" aria-hidden="true"></span>
				<span class="map-legend-label">Cooperate</span>
			</div>
			<div class="relation-legend-item">
				<span class="relation-line relation-assault" aria-hidden="true"></span>
				<span class="map-legend-label">Assault</span>
			</div>
		</div>

		{#if items.length > 0}
			<p class="map-legend-title">Color legend</p>
			<div class="map-legend-list">
				{#each items as item}
					<div class="map-legend-item">
						<ThemeTopicIcon themeLabel={item.label} color={item.color} size={14} />
						<span class="map-legend-label">{item.label}</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="map-legend-empty">No marker themes yet.</p>
		{/if}
	{/if}
</section>

<style>
	.map-legend {
		position: relative;
		pointer-events: auto;
		display: inline-flex;
		flex-direction: column;
		gap: 0.38rem;
		max-width: min(24rem, 48vw);
	}

	.context-pill {
		display: flex;
		align-items: center;
		gap: 0.44rem;
		height: 2rem;
		padding: 0 0.68rem;
		border-radius: 999px;
		border: 1px solid #8f6421;
		background: linear-gradient(160deg, #3e2a11e8, #6f4a18d9);
		color: #ffe4bb;
		font: 600 0.7rem/1 'IBM Plex Mono', monospace;
		white-space: nowrap;
		box-shadow: 0 8px 18px #2a170766;
		cursor: pointer;
	}

	.context-pill-arrow {
		font-size: 0.65rem;
		opacity: 0.88;
	}

	.map-legend-title {
		margin: 0;
		font: 600 0.68rem/1 'IBM Plex Mono', monospace;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #dce7f4;
		padding: 0.14rem 0.2rem 0;
	}

	.map-legend-list {
		display: grid;
		gap: 0.26rem;
		padding: 0.52rem 0.62rem;
		border-radius: 0.56rem;
		border: 1px solid #2f4254;
		background: linear-gradient(160deg, #0b121bcf, #132130b8);
		backdrop-filter: blur(10px);
		box-shadow: 0 10px 26px #01060d88;
	}

	.relation-legend-list {
		display: grid;
		gap: 0.3rem;
		padding: 0.52rem 0.62rem;
		border-radius: 0.56rem;
		border: 1px solid #2f4254;
		background: linear-gradient(160deg, #0b121bcf, #132130b8);
		backdrop-filter: blur(10px);
		box-shadow: 0 10px 26px #01060d88;
	}

	.relation-legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.relation-line {
		width: 1.8rem;
		height: 0.28rem;
		border-radius: 999px;
		box-shadow: 0 0 10px #00000066;
	}

	.relation-cooperate {
		background: #45ff95;
	}

	.relation-assault {
		background: #ff4d4d;
	}

	.map-legend-empty {
		margin: 0;
		padding: 0.52rem 0.62rem;
		border-radius: 0.56rem;
		border: 1px solid #2f4254;
		background: linear-gradient(160deg, #0b121bcf, #132130b8);
		color: #95a6b7;
		font: 500 0.72rem/1.2 'IBM Plex Sans', sans-serif;
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
			max-width: min(19rem, 64vw);
		}
	}
</style>
