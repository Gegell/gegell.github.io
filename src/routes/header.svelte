<script lang="ts">
	import * as config from '$lib/config';
	import { base } from '$app/paths';
</script>

<nav>
	<!-- Title -->
	<a href="{base}/" class="title">
		<b>{config.title}</b>
	</a>

	<!-- Navigation -->
	<ul class="links">
		<li><a href="{base}/">Home</a></li>
		<li><a href="{base}/about">About</a></li>
		<li><a href="{base}/contact">Contact</a></li>
		<!-- <li><a href="/rss.xml" target="_blank">RSS</a></li> -->
	</ul>

	<!-- Theme -->
	<button>Toggle</button>
</nav>

<style>
	nav {
		padding-block: var(--size-7);
	}

	.links {
		margin-block: var(--size-7);
	}

	a {
		color: inherit;
		text-decoration: none;
	}

	ul {
		list-style: none;
		padding: 0;
	}

	li {
		padding-inline-start: 0;
	}

	@media (min-width: 768px) {
		nav {
			display: flex;
			justify-content: space-between;
		}

		.links {
			display: flex;
			gap: var(--size-7);
			margin-block: 0;
		}
	}
</style>
