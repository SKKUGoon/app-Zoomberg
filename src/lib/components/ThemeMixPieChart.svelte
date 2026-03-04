<script lang="ts">
	import { onMount } from 'svelte';

	type ThemeMixEntry = {
		label: string;
		weight: number;
	};

	let {
		data = [],
		height = 126,
		emptyLabel = 'No theme mix data.'
	} = $props<{
		data?: ThemeMixEntry[];
		height?: number;
		emptyLabel?: string;
	}>();

	const BLOOMBERG_PALETTE = ['#f2a900', '#ff8f1f', '#ffd166', '#4db6c8', '#88c057', '#d95f59', '#6ba3ff'];

	let container = $state<HTMLDivElement | null>(null);
	let echartsModule: typeof import('echarts') | null = null;
	let chart: import('echarts').ECharts | null = null;
	let isReady = $state(false);

	const disposeChart = () => {
		if (chart) {
			chart.dispose();
			chart = null;
		}
	};

	const renderPie = () => {
		if (!isReady || !echartsModule || !container) {
			return;
		}

		if (data.length === 0) {
			disposeChart();
			return;
		}

		disposeChart();
		chart = echartsModule.init(container, undefined, { renderer: 'canvas' });

		chart.setOption({
			backgroundColor: 'transparent',
			color: BLOOMBERG_PALETTE,
			tooltip: {
				trigger: 'item',
				backgroundColor: '#0f141b',
				borderColor: '#273746',
				borderWidth: 1,
				textStyle: {
					color: '#dce7f2',
					fontFamily: 'IBM Plex Mono, monospace',
					fontSize: 11
				},
				formatter: '{b}: {c} ({d}%)'
			},
			legend: {
				bottom: 2,
				left: 'center',
				icon: 'circle',
				itemWidth: 8,
				itemHeight: 8,
				itemGap: 8,
				textStyle: {
					color: '#aab9c8',
					fontSize: 10,
					fontFamily: 'IBM Plex Mono, monospace'
				}
			},
			series: [
				{
					type: 'pie',
					radius: ['34%', '56%'],
					center: ['50%', '34%'],
					avoidLabelOverlap: true,
					itemStyle: {
						borderColor: '#101824',
						borderWidth: 2
					},
					label: {
						show: false
					},
					labelLine: {
						show: false
					},
					emphasis: {
						scale: true,
						scaleSize: 4
					},
					data: data.map((entry: ThemeMixEntry) => ({
						name: entry.label,
						value: entry.weight
					}))
				}
			]
		});

		window.setTimeout(() => chart?.resize(), 0);
	};

	$effect(() => {
		void data.length;
		window.setTimeout(() => renderPie(), 0);
	});

	onMount(() => {
		let alive = true;
		const onResize = () => chart?.resize();
		window.addEventListener('resize', onResize);

		void (async () => {
			try {
				const echarts = await import('echarts');
				if (!alive) {
					return;
				}
				echartsModule = echarts;
				isReady = true;
				window.setTimeout(() => renderPie(), 0);
			} catch (error) {
				console.error('theme mix pie init failed', error);
			}
		})();

		return () => {
			alive = false;
			window.removeEventListener('resize', onResize);
			disposeChart();
			echartsModule = null;
			isReady = false;
		};
	});
</script>

{#if data.length === 0}
	<div class="pie-empty">{emptyLabel}</div>
{:else}
	<div bind:this={container} class="pie-chart" style={`height: ${height}px`}></div>
{/if}

<style>
	.pie-chart {
		width: 100%;
	}

	.pie-empty {
		color: #93a6b8;
		font: 500 0.72rem/1.25 'IBM Plex Mono', monospace;
	}
</style>
