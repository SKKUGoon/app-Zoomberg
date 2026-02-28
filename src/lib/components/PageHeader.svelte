<script lang="ts">
	let {
		eyebrow,
		title,
		description
	} = $props<{
		eyebrow: string;
		title: string;
		description: string;
	}>();
</script>

<section class="page-head">
	<p class="eyebrow">{eyebrow}</p>
	<h1>{title}</h1>
	<p>{description}</p>
</section>

<style>
	.page-head {
		margin-bottom: 0.9rem;
		padding: 1rem;
		border: 1px solid #2f343b;
		border-radius: 0.55rem;
		background: linear-gradient(180deg, #181b21, #111318);
	}

	.eyebrow {
		margin: 0;
		font: 600 0.72rem/1 'IBM Plex Mono', monospace;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #f7a437;
	}

	h1 {
		margin: 0.35rem 0;
		font: 700 clamp(1.4rem, 2vw, 2rem) / 1.1 'IBM Plex Sans', sans-serif;
		color: #f4f6f8;
	}

	p {
		margin: 0;
		color: #a8b1bc;
	}
</style>
