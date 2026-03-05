<script lang="ts">
	import { page } from '$app/state';
	import { MAP_NAV_CHILDREN } from '$lib/constants/mapViews';

	type NavChild = {
		label: string;
		href: string;
	};

	type NavItem = {
		label: string;
		href: string;
		icon: string;
		children?: NavChild[];
	};

	const navItems: NavItem[] = [
		{
			label: 'Map',
			href: '/map/global',
			icon: 'map',
			children: MAP_NAV_CHILDREN
		},
		{ label: 'Settings', href: '/settings', icon: 'build' }
	];

	const isActive = (href: string, path: string) => {
		return path === href || path.startsWith(`${href}/`);
	};

	const isItemActive = (item: NavItem, path: string) => {
		if (item.children && item.children.some((entry) => isActive(entry.href, path))) {
			return true;
		}
		return isActive(item.href, path);
	};

	const isMapRoute = $derived(page.url.pathname.startsWith('/map'));
	let sidebarCollapsed = $state(true);
	let mapMobileNavOpen = $state(false);

	$effect(() => {
		if (!isMapRoute) {
			mapMobileNavOpen = false;
		}
	});

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/logo.png" />
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
	<title>Briefing Room</title>
</svelte:head>

<div class="shell" class:collapsed={sidebarCollapsed} class:map-mobile-route={isMapRoute}>
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
			<img class="brand-logo" src="/logo.png" alt="Briefing Room logo" />
			<div class="brand-copy">
				<p class="brand-title">Briefing Room</p>
				<p class="brand-subtitle">Issue Center</p>
			</div>
		</div>

		<nav class="nav">
			{#each navItems as item}
				<div class="nav-group">
					<a class:active={isItemActive(item, page.url.pathname)} href={item.href} aria-label={item.label}>
						<span class="nav-icon material-symbols-outlined" aria-hidden="true">{item.icon}</span>
						<span class="nav-copy">
							<span class="nav-label">{item.label}</span>
						</span>
					</a>
					{#if item.children && item.children.length > 0}
						<div class="nav-subtitle-list" role="list" aria-label={`${item.label} views`}>
							{#each item.children as child}
								<a
									class={`nav-subtitle ${isActive(child.href, page.url.pathname) ? 'active' : ''}`}
									href={child.href}
								>{child.label}</a
								>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</nav>
	</aside>

	{#if isMapRoute}
		<button
			type="button"
			class="map-nav-fab"
			aria-label={mapMobileNavOpen ? 'Close map navigation menu' : 'Open map navigation menu'}
			aria-expanded={mapMobileNavOpen}
			onclick={() => {
				mapMobileNavOpen = !mapMobileNavOpen;
			}}
		>
			<span class="material-symbols-outlined" aria-hidden="true">
				{mapMobileNavOpen ? 'close' : 'menu'}
			</span>
		</button>

		{#if mapMobileNavOpen}
			<button
				type="button"
				class="map-nav-backdrop"
				aria-label="Close map navigation menu"
				onclick={() => {
					mapMobileNavOpen = false;
				}}
			></button>
			<aside class="map-nav-drawer" aria-label="Map navigation menu">
				<div class="brand map-nav-brand">
					<img class="brand-logo" src="/logo.png" alt="Briefing Room logo" />
					<div class="brand-copy map-nav-brand-copy">
						<p class="brand-title">Briefing Room</p>
						<p class="brand-subtitle">Issue Center</p>
					</div>
				</div>
				<nav class="nav map-nav-list">
					{#each navItems as item}
						<div class="nav-group">
							<a
								class:active={isItemActive(item, page.url.pathname)}
								href={item.href}
								aria-label={item.label}
								onclick={() => {
									mapMobileNavOpen = false;
								}}
							>
								<span class="nav-icon material-symbols-outlined" aria-hidden="true">{item.icon}</span>
								<span class="nav-copy">
									<span class="nav-label">{item.label}</span>
								</span>
							</a>
							{#if item.children && item.children.length > 0}
								<div class="nav-subtitle-list" role="list" aria-label={`${item.label} views`}>
									{#each item.children as child}
										<a
											class={`nav-subtitle ${isActive(child.href, page.url.pathname) ? 'active' : ''}`}
											href={child.href}
											onclick={() => {
												mapMobileNavOpen = false;
											}}
										>{child.label}</a
										>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</nav>
			</aside>
		{/if}
	{/if}

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

	.brand-logo {
		width: 2.6rem;
		height: 2.6rem;
		object-fit: cover;
		flex: 0 0 auto;
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
	.nav-copy {
		opacity: 1;
		transition: opacity 130ms ease;
	}

	.shell.collapsed .brand-copy,
	.shell.collapsed .nav-copy {
		opacity: 0;
		width: 0;
		overflow: hidden;
	}

	.shell.collapsed .brand {
		justify-content: center;
		gap: 0;
		padding-inline: 0;
	}

	.nav {
		display: grid;
		gap: 0.55rem;
	}

	.nav-group {
		display: grid;
		gap: 0.36rem;
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

	.nav-copy {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.nav-label {
		font-weight: 500;
		line-height: 1.1;
	}

	.nav-subtitle {
		font: 500 0.67rem/1.2 'IBM Plex Mono', monospace;
		color: #8f98a3;
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		padding: 0.28rem 0.38rem;
		border: 1px solid #262c33;
		border-radius: 0.36rem;
		background: #131920;
	}

	.nav-subtitle:hover {
		border-color: #36404b;
		color: #c8d1dc;
	}

	.nav-subtitle.active {
		border-color: #f7a43766;
		color: #f6f9fc;
		background: #191f27;
	}

	.nav-subtitle-list {
		display: grid;
		gap: 0.16rem;
		margin-top: 0.2rem;
		padding-left: 2.15rem;
	}

	.nav-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.2rem;
		height: 1.2rem;
		color: #d8e1ea;
		flex: 0 0 auto;
		font-size: 1.1rem;
		font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
	}

	.shell.collapsed .nav a {
		justify-content: center;
		padding-inline: 0;
		gap: 0;
	}

	.shell.collapsed .nav-icon {
		width: 1.3rem;
		height: 1.3rem;
	}

	.shell.collapsed .nav-subtitle {
		display: none;
	}

	.shell.collapsed .nav-subtitle-list {
		display: none;
	}

	.shell.collapsed .brand-logo {
		width: 2.7rem;
		height: 2.7rem;
		margin-inline: auto;
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

	.map-nav-fab,
	.map-nav-backdrop,
	.map-nav-drawer {
		display: none;
	}

	@media (max-width: 860px) {
		.shell:not(.map-mobile-route) {
			grid-template-columns: 1fr;
		}

		.shell:not(.map-mobile-route).collapsed {
			grid-template-columns: 1fr;
		}

		.shell:not(.map-mobile-route) .sidebar {
			position: sticky;
			top: 0;
			z-index: 20;
			border-right: 0;
			border-bottom: 1px solid #ffffff1f;
			padding-bottom: 0.9rem;
		}

		.shell:not(.map-mobile-route) .brand {
			margin-bottom: 0.7rem;
			padding-bottom: 0.75rem;
		}

		.shell:not(.map-mobile-route) .nav {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.shell:not(.map-mobile-route) .nav a {
			text-align: center;
			padding-inline: 0.45rem;
			justify-content: center;
		}

		.shell:not(.map-mobile-route) .nav-copy {
			align-items: center;
		}

		.shell:not(.map-mobile-route) .nav-subtitle {
			display: none;
		}

		.shell:not(.map-mobile-route) .nav-subtitle-list {
			display: none;
		}

		.shell:not(.map-mobile-route) .content {
			padding-top: 1rem;
		}

		.shell:not(.map-mobile-route) .content.map-mode {
			padding-top: 0;
		}
	}

	@media (max-width: 860px) {
		.shell.map-mobile-route {
			grid-template-columns: 1fr;
		}

		.shell.map-mobile-route .sidebar {
			display: none;
		}

		.shell.map-mobile-route .content.map-mode {
			padding: 0;
		}

		.shell.map-mobile-route .map-nav-fab {
			display: inline-flex;
			position: fixed;
			top: 0.75rem;
			left: 0.75rem;
			width: 2.8rem;
			height: 2.8rem;
			align-items: center;
			justify-content: center;
			border-radius: 999px;
			border: 1px solid #2f3a45;
			background: #121a24f2;
			color: #e4edf7;
			box-shadow: 0 10px 20px #0000005f;
			z-index: 1200;
		}

		.shell.map-mobile-route .map-nav-fab .material-symbols-outlined {
			font-size: 1.25rem;
			font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
		}

		.shell.map-mobile-route .map-nav-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			border: 0;
			padding: 0;
			margin: 0;
			background: #060a10bf;
			z-index: 1180;
		}

		.shell.map-mobile-route .map-nav-drawer {
			display: block;
			position: fixed;
			top: 4.1rem;
			left: 0.75rem;
			right: 0.75rem;
			padding: 0.7rem;
			border: 1px solid #2f3a45;
			border-radius: 0.7rem;
			background: linear-gradient(180deg, #10161ef7 0%, #0b1118f6 100%);
			box-shadow: 0 18px 34px #02060f8c;
			z-index: 1190;
		}

		.shell.map-mobile-route .map-nav-brand {
			margin-bottom: 0.75rem;
			padding: 0.4rem 0.35rem 0.75rem;
		}

		.shell.map-mobile-route .map-nav-brand-copy {
			opacity: 1;
			width: auto;
			overflow: visible;
		}

		.shell.map-mobile-route .map-nav-list {
			grid-template-columns: 1fr;
		}
	}
</style>
