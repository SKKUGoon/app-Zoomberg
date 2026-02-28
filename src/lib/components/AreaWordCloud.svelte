<script lang="ts">
	import { onMount } from 'svelte';

	type WordCloudTerm = {
		word: string;
		weight: number;
	};

	let {
		words = [],
		emptyLabel = 'No terms available.'
	} = $props<{
		words?: WordCloudTerm[];
		emptyLabel?: string;
	}>();

	let container = $state<HTMLDivElement | null>(null);
	let echartsModule: typeof import('echarts') | null = null;
	let chart: import('echarts').ECharts | null = null;
	let isReady = $state(false);

	const colorForWordRatio = (ratio: number) => {
		const clamped = Math.min(1, Math.max(0, ratio));
		const channel = Math.round(148 + clamped * 107);
		const hex = channel.toString(16).padStart(2, '0');
		return `#${hex}${hex}${hex}`;
	};

	const disposeChart = () => {
		if (chart) {
			chart.dispose();
			chart = null;
		}
	};

	const renderWordCloud = () => {
		if (!isReady || !echartsModule || !container) {
			return;
		}

		if (words.length === 0) {
			disposeChart();
			return;
		}

		disposeChart();
		chart = echartsModule.init(container, undefined, { renderer: 'canvas' });
		const maxWeight = words.reduce((max: number, term: WordCloudTerm) => Math.max(max, term.weight), 1);
		const data = words.map((term: WordCloudTerm) => {
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
					sizeRange: [20, 70],
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

		window.setTimeout(() => chart?.resize(), 0);
	};

	$effect(() => {
		void words.length;
		window.setTimeout(() => renderWordCloud(), 0);
	});

	onMount(() => {
		let alive = true;
		void (async () => {
			try {
				const echarts = await import('echarts');
				await import('echarts-wordcloud');
				if (!alive) {
					return;
				}
				echartsModule = echarts;
				isReady = true;
				window.setTimeout(() => renderWordCloud(), 0);
			} catch (error) {
				console.error('area wordcloud init failed', error);
			}
		})();

		return () => {
			alive = false;
			disposeChart();
			echartsModule = null;
			isReady = false;
		};
	});
</script>

{#if words.length === 0}
	<div class="wordcloud-empty">{emptyLabel}</div>
{:else}
	<div bind:this={container} class="wordcloud-chart"></div>
{/if}

<style>
	.wordcloud-chart {
		margin-top: 0.48rem;
		padding-top: 0.42rem;
		border-top: 1px solid #36516d;
		width: 100%;
		height: 185px;
	}

	.wordcloud-empty {
		margin-top: 0.48rem;
		padding-top: 0.42rem;
		border-top: 1px solid #36516d;
		color: #b7c6d4;
		font-size: 0.78rem;
	}
</style>
