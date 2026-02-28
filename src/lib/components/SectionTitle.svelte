<script lang="ts">
	let { title } = $props<{ title: string }>();
</script>

<section class="section-head">
	<h2>{title}</h2>
</section>

<style>
	.section-head {
		margin-top: 1rem;
	}

	h2 {
		margin: 0 0 0.5rem;
		font: 600 1rem/1.2 'IBM Plex Sans', sans-serif;
		color: #e5eaf0;
	}
</style>
