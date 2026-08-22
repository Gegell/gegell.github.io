<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>{page.status} · Gegell's Blog</title>
</svelte:head>

<section class="error-page">
	<p class="status">{page.status}</p>
	<h1>{page.error?.message ?? 'Page not found'}</h1>
	<a href="{base}/">Return to the blog</a>
</section>

<style>
	.error-page {
		max-width: 60ch;
		margin: 15vh auto;
		text-align: center;
	}

	.status {
		margin: 0;
		color: var(--brand);
		font-size: var(--font-size-8);
		font-weight: bold;
	}

	h1 {
		margin-block: var(--size-3) var(--size-6);
	}
</style>
