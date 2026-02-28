<script lang="ts">
	let {
		source,
		title,
		summary,
		timeLabel,
		link,
		locationLabel,
		themeLabel,
		actionLabel
	} = $props<{
		source: string;
		title: string;
		summary?: string | null;
		timeLabel: string;
		link: string;
		locationLabel: string;
		themeLabel: string;
		actionLabel: string;
	}>();
</script>

<article class="news-card">
	<p class="source">{source}</p>
	<p class="title">
		<a href={link} target="_blank" rel="noopener noreferrer">{title}</a>
	</p>
	{#if summary}
		<p class="summary">{summary}</p>
	{/if}
	<div class="meta">
		<span>{timeLabel}</span>
		<span>{locationLabel}</span>
	</div>
	<div class="meta">
		<span>Theme: {themeLabel}</span>
		<span>Action: {actionLabel}</span>
	</div>
</article>

<style>
	.news-card {
		padding: 0.75rem;
		border-radius: 0.45rem;
		border: 1px solid #2d3238;
		background: #0f1216;
	}

	.source {
		margin: 0;
		font: 600 0.73rem/1.2 'IBM Plex Mono', monospace;
		text-transform: uppercase;
		color: #ffb146;
	}

	.title {
		margin: 0.35rem 0;
		color: #d4dbe3;
	}

	.summary {
		margin: 0 0 0.45rem;
		color: #aab3bd;
		font-size: 0.86rem;
		line-height: 1.35;
	}

	.title a {
		color: inherit;
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: border-color 140ms ease;
	}

	.title a:hover {
		border-color: #f7a437;
	}

	.meta {
		display: flex;
		justify-content: space-between;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: #95a0ac;
	}

	@media (max-width: 980px) {
		.meta {
			flex-direction: column;
		}
	}
</style>
