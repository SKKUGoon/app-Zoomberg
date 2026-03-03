<script lang="ts">
	let {
		items,
		position = 'top',
		ariaLabel
	} = $props<{
		items: string[];
		position?: 'top' | 'bottom';
		ariaLabel: string;
	}>();
</script>

<div class={`globe-banner ${position === 'top' ? 'globe-banner-top' : 'globe-banner-bottom'}`} aria-label={ariaLabel}>
	<div class="globe-banner-track">
		{#each [...items, ...items] as item, index (`${position}-${index}-${item}`)}
			<span class="globe-banner-item">{item}</span>
		{/each}
	</div>
</div>

<style>
	.globe-banner {
		position: absolute;
		left: 1rem;
		right: 1rem;
		z-index: 515;
		overflow: hidden;
		border: 1px solid #2f4254;
		border-radius: 0.56rem;
		background: linear-gradient(160deg, #0b121bcf, #132130b8);
		backdrop-filter: blur(10px);
		box-shadow: 0 10px 26px #01060d88;
		pointer-events: auto;
	}

	.globe-banner-top {
		top: var(--globe-banner-offset);
	}

	.globe-banner-bottom {
		bottom: var(--globe-banner-offset);
	}

	.globe-banner-track {
		display: inline-flex;
		align-items: center;
		gap: 0;
		white-space: nowrap;
		width: max-content;
		min-width: 100%;
		animation: globe-banner-scroll 90s linear infinite;
		will-change: transform;
	}

	.globe-banner:hover .globe-banner-track {
		animation-play-state: paused;
	}

	.globe-banner-item {
		position: relative;
		display: inline-flex;
		align-items: center;
		padding: 0.45rem 1.05rem;
		font: 500 0.72rem/1 'IBM Plex Sans', sans-serif;
		color: #dce7f4;
	}

	.globe-banner-item::after {
		content: '•';
		position: absolute;
		right: 0;
		color: #8ea2b7;
	}

	@keyframes globe-banner-scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	@media (max-width: 680px) {
		.globe-banner {
			left: 0.75rem;
			right: 0.75rem;
		}

		.globe-banner-item {
			font-size: 0.69rem;
			padding: 0.42rem 0.86rem;
		}
	}
</style>
