<script lang="ts">
	let {
		title,
		tag = 'Placeholder',
		wide = false,
		className = '',
		children
	} = $props<{
		title: string;
		tag?: string;
		wide?: boolean;
		className?: string;
		children: () => unknown;
	}>();

	const classes = $derived(`panel-card ${wide ? 'wide' : ''} ${className}`.trim());
</script>

<article class={classes}>
	<h2>{title}</h2>
	{#if tag}
		<p class="tag">{tag}</p>
	{/if}
	{@render children()}
</article>

<style>
	.panel-card {
		grid-column: span 6;
		padding: 0.9rem;
		border: 1px solid #2d3238;
		border-radius: 0.55rem;
		background: #14181d;
	}

	.wide {
		grid-column: 1 / -1;
	}

	h2 {
		margin: 0;
		font: 600 0.96rem/1.2 'IBM Plex Sans', sans-serif;
		color: #f0f3f7;
	}

	.tag {
		margin: 0.35rem 0 0.55rem;
		font: 500 0.74rem/1 'IBM Plex Mono', monospace;
		color: #f7a437;
		text-transform: uppercase;
	}

	@media (max-width: 980px) {
		.panel-card {
			grid-column: span 12;
		}
	}
</style>
