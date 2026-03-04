<script lang="ts">
	import ThemeTopicIcon from '$lib/components/ThemeTopicIcon.svelte';
	import {
		CURRENCY_GREEN,
		DEVELOPED_STOCKS_BLUE,
		EMERGING_STOCKS_ORANGE,
		isCurrencyAssetTheme,
		isDevelopedStocksTheme,
		isEmergingStocksTheme
	} from '$lib/domain/themeTaxonomy';

	let {
		source,
		title,
		summary,
		timeLabel,
		link,
		locationLabel,
		themeUpperLabel,
		themeLowerLabel,
		geoRelationshipLabel = null,
		selected = false,
		onSelect
	} = $props<{
		source: string;
		title: string;
		summary?: string | null;
		timeLabel: string;
		link: string;
		locationLabel: string;
		themeUpperLabel: string;
		themeLowerLabel: string;
		geoRelationshipLabel?: string | null;
		selected?: boolean;
		onSelect?: () => void;
	}>();

	const topicIconColor = $derived.by(() => {
		if (isCurrencyAssetTheme(themeUpperLabel)) {
			return CURRENCY_GREEN;
		}
		if (isDevelopedStocksTheme(themeUpperLabel)) {
			return DEVELOPED_STOCKS_BLUE;
		}
		if (isEmergingStocksTheme(themeUpperLabel)) {
			return EMERGING_STOCKS_ORANGE;
		}
		return '#f2a93b';
	});
</script>

<div
	class="news-card"
	class:selected={selected}
	role="button"
	tabindex="0"
	aria-pressed={selected}
	onclick={onSelect}
	onkeydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onSelect?.();
		}
	}}
>
	<div class="card-top-row">
		<p class="source">{source}</p>
		<p class="location">{locationLabel}</p>
	</div>
	<p class="title">
		<a
			href={link}
			target="_blank"
			rel="noopener noreferrer"
			onclick={(event) => {
				event.stopPropagation();
			}}
		>
			{title}
		</a>
	</p>
	{#if summary}
		<p class="summary">{summary}</p>
	{/if}
	<div class="topic-main-row">
		<ThemeTopicIcon themeLabel={themeUpperLabel} color={topicIconColor} size={15} />
		<span>Main topic: {themeUpperLabel}</span>
	</div>
	<p class="topic-sub">Subtopic: {themeLowerLabel}</p>
	{#if geoRelationshipLabel}
		<div class="meta">
			<span>Geo-relationship: {geoRelationshipLabel}</span>
		</div>
	{/if}
	<div class="card-action-row">
		<span class="published-time">Published: {timeLabel}</span>
		<button
			type="button"
			class="focus-button"
			onclick={(event) => {
				event.stopPropagation();
				onSelect?.();
			}}
		>
			{selected ? 'Hide relation view' : 'Show relation view'}
		</button>
	</div>
</div>

<style>
	.news-card {
		padding: 0.9rem 0.95rem;
		border-radius: 0.45rem;
		border: 1px solid #2d3238;
		background: #0f1216;
		cursor: pointer;
		transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
	}

	.news-card:hover {
		border-color: #3f576f;
		box-shadow: 0 7px 18px #00000045;
		transform: translateY(-1px);
	}

	.news-card.selected {
		border-color: #b8873d;
		box-shadow: 0 0 0 1px #b8873d66, 0 0 18px #c78f3a2a;
	}

	.source {
		margin: 0;
		font: 600 0.73rem/1.2 'IBM Plex Mono', monospace;
		text-transform: uppercase;
		color: #ffb146;
	}

	.card-top-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.location {
		margin: 0;
		text-align: right;
		font: 600 0.73rem/1.2 'IBM Plex Mono', monospace;
		color: #d6e6f7;
		letter-spacing: 0.01em;
	}

	.title {
		margin: 0.45rem 0 0.5rem;
		color: #d4dbe3;
		font-size: 0.96rem;
		line-height: 1.35;
	}

	.summary {
		margin: 0 0 0.62rem;
		color: #aab3bd;
		font-size: 0.88rem;
		line-height: 1.45;
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
		flex-wrap: wrap;
		gap: 0.32rem 0.7rem;
		margin-top: 0.22rem;
		font-size: 0.79rem;
		line-height: 1.32;
		color: #95a0ac;
	}

	.topic-main-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.22rem;
		font-size: 0.79rem;
		line-height: 1.32;
		color: #95a0ac;
	}

	.topic-sub {
		margin: 0.16rem 0 0;
		font-size: 0.79rem;
		line-height: 1.32;
		color: #95a0ac;
	}

	.card-action-row {
		margin-top: 0.62rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.published-time {
		font: 500 0.72rem/1 'IBM Plex Mono', monospace;
		color: #a6b2bf;
	}

	.focus-button {
		padding: 0.26rem 0.52rem;
		border-radius: 0.34rem;
		border: 1px solid #7f5d2f;
		background: #1b1711;
		color: #e8b56f;
		font: 600 0.68rem/1.15 'IBM Plex Mono', monospace;
		cursor: pointer;
	}

	.focus-button:hover {
		border-color: #a6793d;
		background: #221d16;
		color: #f0c184;
	}

	@media (max-width: 980px) {
		.meta {
			flex-direction: column;
		}

		.card-top-row {
			flex-direction: column;
			gap: 0.24rem;
		}

		.location {
			text-align: left;
		}
	}
</style>
