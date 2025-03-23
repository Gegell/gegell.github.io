<script lang="ts">
	import * as config from '$lib/config';
	import { base } from '$app/paths';
	import ThemeToggle from './themeToggle.svelte';
</script>

<nav>
	<!-- Title -->
	<div class="top-row">
		<a href="{base}/" class="title">
			<b>{config.title}</b>
		</a>

		<!-- Theme -->
		<ThemeToggle />
	</div>

	<!-- Navigation -->
	<ul class="links">
		<li><a href="{base}/">Blog</a></li>
		<li><a href="{base}/about">About</a></li>
		<!-- <li><a href="/rss.xml" target="_blank">RSS</a></li> -->
	</ul>
</nav>

<style>
	nav {
		padding-block: var(--size-7);
		gap: var(--size-4);
		display: flex;
		justify-content: space-between;
	}

	.top-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex: 1;
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
