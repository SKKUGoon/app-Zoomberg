<script lang="ts">
	let {
		minMs = null,
		maxMs = null,
		startMs = null,
		maxWindowMs = 48 * 60 * 60 * 1000,
		onChangeStart,
		disabled = false
	} = $props<{
		minMs?: number | null;
		maxMs?: number | null;
		startMs?: number | null;
		maxWindowMs?: number;
		onChangeStart?: (start: number) => void;
		disabled?: boolean;
	}>();

	const formatTime = (value: number) =>
		new Intl.DateTimeFormat('en', {
			hour: '2-digit',
			minute: '2-digit',
			month: 'short',
			day: '2-digit'
		}).format(new Date(value));

	const clamp = (value: number, lower: number, upper: number) => Math.min(Math.max(value, lower), upper);
	const MINUTE_MS = 60_000;

	const hasData = $derived.by(() => minMs !== null && maxMs !== null && startMs !== null);

	const totalSpanMs = $derived.by(() => {
		if (!hasData || minMs === null || maxMs === null) {
			return null;
		}
		return Math.max(0, maxMs - minMs);
	});

	const activeWindowMs = $derived.by(() => {
		if (totalSpanMs === null) {
			return null;
		}
		return Math.min(maxWindowMs, totalSpanMs);
	});

	const latestStartMs = $derived.by(() => {
		if (!hasData || minMs === null || maxMs === null || activeWindowMs === null) {
			return null;
		}
		return Math.max(minMs, maxMs - activeWindowMs);
	});

	const selectedStartMs = $derived.by(() => {
		if (!hasData || latestStartMs === null || minMs === null) {
			return null;
		}
		return clamp(startMs!, minMs, latestStartMs);
	});

	let localStartMs = $state<number | null>(null);
	let sliderElement = $state<HTMLDivElement | null>(null);

	$effect(() => {
		localStartMs = selectedStartMs;
	});

	const visualStartMs = $derived.by(() => localStartMs ?? selectedStartMs);

	const selectedEndMs = $derived.by(() => {
		if (visualStartMs === null || activeWindowMs === null || maxMs === null) {
			return null;
		}
		return Math.min(maxMs, visualStartMs + activeWindowMs);
	});

	const selectedWindowLabel = $derived.by(() => {
		if (activeWindowMs === null) {
			return 'n/a';
		}
		const minutes = Math.round(activeWindowMs / 60_000);
		const hours = (minutes / 60).toFixed(1).replace(/\.0$/, '');
		return `${hours}h`;
	});

	const startPct = $derived.by(() => {
		if (!hasData || visualStartMs === null || minMs === null || maxMs === null || maxMs === minMs) {
			return 0;
		}
		return ((visualStartMs - minMs) / (maxMs - minMs)) * 100;
	});

	const endPct = $derived.by(() => {
		if (!hasData || selectedEndMs === null || minMs === null || maxMs === null || maxMs === minMs) {
			return 100;
		}
		return ((selectedEndMs - minMs) / (maxMs - minMs)) * 100;
	});

	const onStartInput = (event: Event) => {
		if (minMs === null || latestStartMs === null) {
			return;
		}
		const nextValue = Number((event.currentTarget as HTMLInputElement).value);
		if (Number.isNaN(nextValue)) {
			return;
		}
		const boundedStart = clamp(nextValue, minMs, latestStartMs);
		localStartMs = boundedStart;
	};

	const commitStartChange = () => {
		if (localStartMs === null || selectedStartMs === null) {
			return;
		}

		const roundedStart = Math.round(localStartMs / MINUTE_MS) * MINUTE_MS;
		if (roundedStart !== selectedStartMs) {
			onChangeStart?.(roundedStart);
		}
	};

	const onSliderClick = (event: MouseEvent) => {
		if (
			disabled ||
			!sliderElement ||
			minMs === null ||
			maxMs === null ||
			latestStartMs === null ||
			activeWindowMs === null
		) {
			return;
		}

		const rect = sliderElement.getBoundingClientRect();
		if (rect.width <= 0) {
			return;
		}

		const clickOffsetX = clamp(event.clientX - rect.left, 0, rect.width);
		const clickRatio = clickOffsetX / rect.width;
		const clickMs = minMs + clickRatio * (maxMs - minMs);
		const centeredStart = clamp(clickMs - activeWindowMs / 2, minMs, latestStartMs);
		localStartMs = centeredStart;
		commitStartChange();
	};
</script>

{#if hasData && selectedStartMs !== null && selectedEndMs !== null}
	<div class="time-window-panel">
		<p class="time-window-title">Published Time Window (fixed at 48h)</p>
		<div class="time-window-row">
			<span>{formatTime(visualStartMs ?? selectedStartMs)}</span>
			<span>{formatTime(selectedEndMs)}</span>
		</div>
		<div
			class="time-window-slider"
			style={`--start-pct:${startPct}%; --end-pct:${endPct}%`}
			bind:this={sliderElement}
		>
			<div class="time-window-track"></div>
			<div class="time-window-fill" role="presentation"></div>
			<button
				type="button"
				class="time-window-click-target"
				onclick={onSliderClick}
				disabled={disabled || latestStartMs === minMs}
				aria-label="Recenter published time window"
			></button>
			<input
				type="range"
				min={minMs!}
				max={latestStartMs!}
				value={visualStartMs ?? selectedStartMs}
				step={60_000}
				oninput={onStartInput}
				onchange={commitStartChange}
				disabled={disabled || latestStartMs === minMs}
				aria-label="Published time window"
			/>
		</div>
		<p class="time-window-bounds">Window: {selectedWindowLabel} | Bounds: {formatTime(minMs!)} - {formatTime(maxMs!)}</p>
	</div>
{/if}

<style>
	.time-window-panel {
		margin: 0 0 0.75rem;
		padding: 0.52rem 0.6rem;
		border-radius: 0.44rem;
		border: 1px solid #4f3b20;
		background: #14110d;
		min-width: 0;
	}

	.time-window-title {
		margin: 0 0 0.35rem;
		font: 600 0.71rem/1.2 'IBM Plex Mono', monospace;
		color: #f2b35f;
	}

	.time-window-row {
		display: flex;
		justify-content: space-between;
		gap: 0.55rem;
		font: 600 0.7rem/1.15 'IBM Plex Mono', monospace;
		color: #d8d2c6;
		margin-bottom: 0.2rem;
	}

	.time-window-slider {
		position: relative;
		height: 1.4rem;
		margin: 0.28rem 0;
	}

	.time-window-track,
	.time-window-fill {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		height: 0.28rem;
		border-radius: 999px;
		pointer-events: none;
	}

	.time-window-track {
		left: 0;
		right: 0;
		background: #3a3124;
	}

	.time-window-fill {
		left: var(--start-pct, 0%);
		right: calc(100% - var(--end-pct, 100%));
		background: linear-gradient(90deg, #e0a14b, #f0b35c);
		pointer-events: none;
		cursor: pointer;
		height: 0.42rem;
		z-index: 2;
	}

	.time-window-fill::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: -0.42rem;
		bottom: -0.42rem;
	}

	.time-window-slider input[type='range'] {
		position: absolute;
		inset: 0;
		width: 100%;
		margin: 0;
		background: none;
		appearance: none;
		pointer-events: none;
		z-index: 1;
	}

	.time-window-click-target {
		position: absolute;
		inset: 0;
		border: 0;
		padding: 0;
		margin: 0;
		background: transparent;
		cursor: pointer;
		z-index: 3;
	}

	.time-window-click-target:disabled {
		cursor: default;
	}

	.time-window-slider input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 0;
		height: 0;
		border: 0;
		background: transparent;
		box-shadow: none;
	}

	.time-window-slider input[type='range']::-moz-range-thumb {
		width: 0;
		height: 0;
		border: 0;
		background: transparent;
		box-shadow: none;
	}

	.time-window-slider input[type='range']::-webkit-slider-runnable-track,
	.time-window-slider input[type='range']::-moz-range-track {
		height: 0.28rem;
		background: transparent;
	}

	.time-window-bounds {
		margin: 0.26rem 0 0;
		font: 500 0.67rem/1.2 'IBM Plex Mono', monospace;
		color: #c5b49b;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
