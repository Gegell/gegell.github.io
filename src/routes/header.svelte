<script lang="ts">
	import * as config from '$lib/config';
	import { mobileHeader, mobileToc } from '$lib/mobile.svelte';
	import { toc } from '$lib/toc.svelte';
	import { base } from '$app/paths';
	import ThemeToggle from './themeToggle.svelte';
	import TocToggleButton from '$lib/components/TocToggleButton.svelte';
	import { onMount } from 'svelte';

	let hideHeader = $state(false);

	onMount(() => {
		let previousScrollY = window.scrollY;

		function updateHeaderVisibility() {
			if (!mobileHeader.matches) {
				hideHeader = false;
				previousScrollY = window.scrollY;
				return;
			}

			if (toc.open) {
				hideHeader = false;
				return;
			}

			const currentScrollY = window.scrollY;
			const delta = currentScrollY - previousScrollY;

			if (currentScrollY <= 0 || delta < -4) {
				hideHeader = false;
			} else if (currentScrollY > 32 && delta > 4) {
				hideHeader = true;
			}

			previousScrollY = currentScrollY;
		}

		updateHeaderVisibility();
		window.addEventListener('scroll', updateHeaderVisibility, { passive: true });

		return () => {
			window.removeEventListener('scroll', updateHeaderVisibility);
		};
	});

	$effect(() => {
		if (!mobileHeader.matches) {
			hideHeader = false;
		}
	});
</script>

<header class:hide={hideHeader} class:narrow={mobileHeader.matches}>
	<nav>
		<div class="header-left">
			<a href="{base}/" class="title">
				<b>{config.title}</b>
			</a>
		</div>

		<div class="header-center">
			{#if toc.available && mobileToc.matches}
				<TocToggleButton />
			{/if}
		</div>

		<div class="header-right">
			<ThemeToggle />

			<ul class="links">
				<li><a href="{base}/">Blog</a></li>
				<li><a href="{base}/about">About</a></li>
				<!-- <li><a href="/rss.xml" target="_blank">RSS</a></li> -->
			</ul>
		</div>
	</nav>
</header>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--background);
		transition: transform 0.18s ease;
		padding-block: var(--size-3);
		padding-inline: var(--size-7);
	}
	
	header.narrow.hide {
		transform: translateY(-100%);
	}
	
	nav {
		padding-block: var(--size-3);
		gap: var(--size-4);
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--border);
	}

	.header-left,
	.header-right {
		/* flex: 1 1 0; */
		min-width: 0;
		width: fit-content;
	}

	.title {
		display: inline-block;
		max-width: fit-content;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-center {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
	}

	.header-right {
		display: flex;
		justify-content: end;
		align-items: center;
		gap: var(--size-4);
	}

	a {
		color: inherit;
		text-decoration: none;
	}

	ul.links {
		list-style: none;
		display: flex;
		padding: 0;
		flex-direction: row;
		align-items: center;
		max-width: fit-content;
		gap: var(--size-4);
		margin-block: 0;
	}

	li {
		padding-inline-start: 0;
	}
</style>
