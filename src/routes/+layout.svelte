<script lang="ts">
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';

	const navItems = [
		{ label: 'Map', href: '/map', icon: 'map' },
		{ label: 'Setting', href: '/settings', icon: 'build' }
	] as const;

	const isActive = (href: string, path: string) => {
		return path.startsWith(href);
	};

	const isMapRoute = $derived(page.url.pathname.startsWith('/map'));
	let sidebarCollapsed = $state(false);

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,500,0,0"
		rel="stylesheet"
	/>
	<title>Zoomberg Terminal</title>
</svelte:head>

<div class="shell" class:collapsed={sidebarCollapsed}>
	<aside class="sidebar" aria-label="Primary navigation">
		<button
			type="button"
			class="collapse-toggle"
			aria-label={sidebarCollapsed ? 'Expand side panel' : 'Collapse side panel'}
			aria-expanded={!sidebarCollapsed}
			onclick={() => {
				sidebarCollapsed = !sidebarCollapsed;
			}}
		>
			<span aria-hidden="true">{sidebarCollapsed ? '>' : '<'}</span>
		</button>

		<div class="brand">
			<div class="brand-dot" aria-hidden="true"></div>
			<div class="brand-copy">
				<p class="brand-title">Zoomberg Terminal</p>
				<p class="brand-subtitle">Issue Center</p>
			</div>
		</div>

		<nav class="nav">
			{#each navItems as item}
				<a class:active={isActive(item.href, page.url.pathname)} href={item.href} aria-label={item.label}>
					<span class="nav-icon material-symbols-outlined" aria-hidden="true">{item.icon}</span>
					<span class="nav-label">{item.label}</span>
				</a>
			{/each}
		</nav>
	</aside>

	<main class="content" class:map-mode={isMapRoute}>
		{@render children()}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		min-height: 100vh;
		font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
		background: radial-gradient(circle at 88% -10%, #242a31 0%, transparent 36%),
			linear-gradient(180deg, #0b0d10 0%, #0f1216 60%, #0b0d10 100%);
		color: #e8edf2;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.shell {
		display: grid;
		grid-template-columns: 250px minmax(0, 1fr);
		min-height: 100vh;
		transition: grid-template-columns 180ms ease;
	}

	.shell.collapsed {
		grid-template-columns: 76px minmax(0, 1fr);
	}

	.sidebar {
		padding: 0.9rem 0.8rem;
		border-right: 1px solid #2a2f35;
		background: linear-gradient(180deg, #121519 0%, #0d1014 100%);
		backdrop-filter: blur(14px);
	}

	.collapse-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.8rem;
		height: 1.8rem;
		margin-bottom: 0.8rem;
		border-radius: 0.45rem;
		border: 1px solid #2b3138;
		background: #13171c;
		color: #b8c2cc;
		cursor: pointer;
	}

	.collapse-toggle:hover {
		background: #1a1f25;
		color: #e5ebf2;
	}

	.brand {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding: 0.55rem 0.5rem 1rem;
		border-bottom: 1px solid #272d34;
		margin-bottom: 1rem;
	}

	.brand-dot {
		width: 0.9rem;
		height: 0.9rem;
		border-radius: 50%;
		background: #f7a437;
		box-shadow: 0 0 10px #f7a43755;
	}

	.brand-title {
		margin: 0;
		font: 700 1rem/1.2 'Space Grotesk', sans-serif;
	}

	.brand-subtitle {
		margin: 0.15rem 0 0;
		font-size: 0.78rem;
		color: #8f98a3;
	}

	.brand-copy,
	.nav-label {
		opacity: 1;
		transition: opacity 130ms ease;
	}

	.shell.collapsed .brand-copy,
	.shell.collapsed .nav-label {
		opacity: 0;
		width: 0;
		overflow: hidden;
	}

	.shell.collapsed .brand {
		justify-content: center;
		padding-inline: 0;
	}

	.nav {
		display: grid;
		gap: 0.55rem;
	}

	.nav a {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.62rem 0.7rem;
		border: 1px solid #22272d;
		border-radius: 0.45rem;
		text-decoration: none;
		color: #c9d0d8;
		font-weight: 500;
		transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease;
	}

	.nav-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.55rem;
		height: 1.55rem;
		border-radius: 0.4rem;
		background: #1b2026;
		border: 1px solid #2a3037;
		color: #d8e1ea;
		flex: 0 0 auto;
		font-size: 1rem;
		font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
	}

	.shell.collapsed .nav a {
		justify-content: center;
		padding-inline: 0;
		gap: 0;
	}

	.shell.collapsed .nav-icon {
		width: 1.9rem;
		height: 1.9rem;
	}

	.shell.collapsed .collapse-toggle {
		display: flex;
		margin-inline: auto;
		width: 1.9rem;
		height: 1.9rem;
	}

	.nav a:hover {
		transform: translateX(2px);
		background: #171b20;
		border-color: #2d333a;
	}

	.nav a.active {
		background: linear-gradient(120deg, #2b2f35, #22272d);
		border-color: #f7a43766;
		color: #f7f9fb;
		box-shadow: inset 2px 0 0 #f7a437;
	}

	.content {
		padding: 1.25rem;
	}

	.content.map-mode {
		padding: 0;
	}

	@media (max-width: 860px) {
		.shell {
			grid-template-columns: 1fr;
		}

		.shell.collapsed {
			grid-template-columns: 1fr;
		}

		.sidebar {
			position: sticky;
			top: 0;
			z-index: 20;
			border-right: 0;
			border-bottom: 1px solid #ffffff1f;
			padding-bottom: 0.9rem;
		}

		.brand {
			margin-bottom: 0.7rem;
			padding-bottom: 0.75rem;
		}

		.nav {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.nav a {
			text-align: center;
			padding-inline: 0.45rem;
			justify-content: center;
		}

		.content {
			padding-top: 1rem;
		}

		.content.map-mode {
			padding-top: 0;
		}
	}
</style>
