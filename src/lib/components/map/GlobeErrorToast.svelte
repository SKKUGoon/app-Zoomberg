<script lang="ts">
	let { message } = $props<{ message: string }>();
</script>

{#if message}
	<div class="globe-error">{message}</div>
{/if}

<style>
	.globe-error {
		position: absolute;
		left: 1rem;
		top: 1rem;
		padding: 0.5rem 0.7rem;
		border: 1px solid #6a2f2f;
		background: #1a1010;
		color: #ffb5b5;
		font-size: 0.78rem;
		border-radius: 0.5rem;
		z-index: 650;
	}
</style>
