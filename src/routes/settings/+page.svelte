<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PanelCard from '$lib/components/PanelCard.svelte';

	const pollOptions = ['1 minute (default)', '5 minutes', '10 minutes'];
	const newsFields = [
		'source, source_title, source_link',
		'summary, time_published, rss_item_id',
		'map__news_cities.news_id -> fact__distilled_news.id',
		'map__news_relationship from_city_id / to_city_id',
		'dim__city latitude/longitude for map markers and links',
		'keyword_theme_upper/lower',
		'relation_type: Assault, Cooperate, Independent'
	];
</script>

<PageHeader
	eyebrow="Settings"
	title="News Pipeline Settings"
	description="This app now runs on Postgres-backed news only. gRPC and Influx integrations were removed."
/>

<section class="settings-grid" aria-label="News configuration">
	<PanelCard title="Database Connection" className="settings-panel" tag="Env Vars">
		<ul>
			<li>Host: `NEWS_DB_HOST` (default `18.183.227.234`)</li>
			<li>Port: `NEWS_DB_PORT` (default `5432`)</li>
			<li>User: `NEWS_DB_USER` (default `postgres`)</li>
			<li>Password: `NEWS_DB_PASSWORD`</li>
			<li>Database: `NEWS_DB_NAME` (default `postgres`)</li>
			<li>Optional TLS: `NEWS_DB_SSL=true|false`</li>
		</ul>
	</PanelCard>

	<PanelCard title="Polling" className="settings-panel" tag="Map Feed">
		<ul>
			{#each pollOptions as option}
				<li>{option}</li>
			{/each}
			<li>Map renders max 50 markers per page</li>
			<li>Pagination moves through 50-row pages</li>
		</ul>
	</PanelCard>

	<PanelCard title="Data Access Layer" className="settings-panel" tag="Drizzle ORM">
		<ul>
			<li>Read-only query path (no migrations)</li>
			<li>Tables: mart.fact__distilled_news + mart.map__news_cities + mart.map__news_relationship + mart.dim__city</li>
			<li>Join keys: news_id, city_id, from_city_id, to_city_id</li>
		</ul>
	</PanelCard>

	<PanelCard title="News Data Fields" className="settings-panel" tag="mart.fact__distilled_news">
		<ul>
			{#each newsFields as field}
				<li>{field}</li>
			{/each}
		</ul>
	</PanelCard>
</section>

<style>
	.settings-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.85rem;
	}

	:global(.settings-panel) {
		grid-column: auto;
	}

	ul {
		margin: 0;
		padding-left: 1.1rem;
		color: #cad2dc;
	}

	li + li {
		margin-top: 0.35rem;
	}

	@media (max-width: 980px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
