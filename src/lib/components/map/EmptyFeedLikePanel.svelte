<script lang="ts">
	type PanelMode = 'full' | 'summary' | 'minimized';

	let {
		title,
		mode,
		onModeChange
	} = $props<{
		title: string;
		mode: PanelMode;
		onModeChange: (nextMode: PanelMode) => void;
	}>();

	const setMode = (nextMode: PanelMode) => {
		if (mode !== nextMode) {
			onModeChange(nextMode);
		}
	};
</script>

<section class="panel" class:summary={mode === 'summary'} class:minimized={mode === 'minimized'}>
	<div class="panel-heading-row">
		<div class="panel-heading">
			<div class="heading-title-row">
				<div class="panel-mode-controls" role="toolbar" aria-label={`${title} panel mode`}>
					<button
						type="button"
						class="mode-dot mode-minimized"
						class:active={mode === 'minimized'}
						aria-label={`Minimize ${title} panel`}
						onclick={() => setMode('minimized')}
					>
						<span aria-hidden="true">-</span>
					</button>
					<button
						type="button"
						class="mode-dot mode-summary"
						class:active={mode === 'summary'}
						aria-label={`Show summary ${title} panel`}
						onclick={() => setMode('summary')}
					>
						<span aria-hidden="true">~</span>
					</button>
					<button
						type="button"
						class="mode-dot mode-full"
						class:active={mode === 'full'}
						aria-label={`Open full ${title} panel`}
						onclick={() => setMode('full')}
					>
						<span aria-hidden="true">+</span>
					</button>
				</div>
				<h2>{title}</h2>
			</div>
		</div>
	</div>

	{#if mode === 'minimized'}
		<div class="minimized-strip">{title} panel</div>
	{:else if mode === 'summary'}
		<div class="placeholder summary-placeholder" aria-label={`${title} summary placeholder`}>
			<p>Summary mode ready.</p>
		</div>
	{:else}
		<div class="placeholder full-placeholder" aria-label={`${title} empty panel`}>
			<p>Empty panel ready for {title} integration.</p>
		</div>
	{/if}
</section>

<style>
	.panel {
		pointer-events: auto;
		width: 100%;
		max-width: 30rem;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		padding: 0.8rem;
		height: 100%;
		min-height: 0;
		overflow: hidden;
		border: 1px solid #f3f6fb1f;
		backdrop-filter: blur(14px);
		background: linear-gradient(145deg, #0c131bc9, #111a25a8);
		box-shadow: 0 16px 40px #02060c88;
		border-radius: 0.8rem;
	}

	.panel.summary {
		height: auto;
		max-height: min(13rem, 38vh);
	}

	.panel.minimized {
		align-self: flex-end;
		height: auto;
		width: 100%;
		max-width: 30rem;
		padding: 0.55rem 0.7rem;
	}

	.panel-heading-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.heading-title-row {
		display: flex;
		align-items: center;
		gap: 0.42rem;
	}

	.panel-heading h2 {
		margin: 0;
		font: 600 0.95rem/1.2 'IBM Plex Sans', sans-serif;
		color: #f6fbff;
	}

	.panel-mode-controls {
		display: inline-flex;
		align-items: center;
		gap: 0.34rem;
	}

	.mode-dot {
		width: 0.92rem;
		height: 0.92rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		border: 1px solid #00000066;
		padding: 0;
		cursor: pointer;
		color: #000000c7;
		font: 700 0.58rem/1 'IBM Plex Mono', monospace;
		opacity: 0.7;
	}

	.mode-dot.active {
		opacity: 1;
		box-shadow: 0 0 0 1px #dce7f47a;
	}

	.mode-minimized {
		background: #ff5f57;
	}

	.mode-summary {
		background: #febc2e;
	}

	.mode-full {
		background: #28c840;
	}

	.minimized-strip {
		margin-top: 0.12rem;
		font: 600 0.74rem/1.15 'IBM Plex Mono', monospace;
		color: #d8e8fb;
		white-space: nowrap;
	}

	.placeholder {
		margin-top: 0.6rem;
		border: 1px dashed #37506b;
		border-radius: 0.55rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #9eb5cc;
		font: 500 0.78rem/1.3 'IBM Plex Mono', monospace;
		text-align: center;
		padding: 0.8rem;
	}

	.full-placeholder {
		flex: 1 1 auto;
		min-height: 10rem;
	}

	.summary-placeholder {
		min-height: 4.8rem;
	}
</style>
