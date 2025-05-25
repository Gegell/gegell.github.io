<script lang="ts">
	import Toc from '$lib/components/Toc.svelte';
	import { dateFormat } from '$lib/util';

	let { data } = $props();
</script>

<!-- SEO -->
<svelte:head>
	<title>{data.title}</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.title} />
</svelte:head>

<article>
	<!-- Title -->
	<hgroup class="title">
		<h1>{data.title}</h1>
		<p>Published at {dateFormat(data.date)}</p>
	</hgroup>

	<!-- Tags -->
	<div class="tags">
		{#each data.categories as tag}
			<span class="surface-4">&num;{tag}</span>
		{/each}
	</div>

	<!-- Table of Content TOC -->
	{#if data.showToc}
		<Toc headings={data.toc} />
	{/if}

	<!-- Post content -->
	<div class="prose">
		<data.content />
	</div>
</article>

<style>
	.title h1 {
		font-size: var(--font-size-6);
		margin-block: var(--size-3);
		color: var(--brand);
		max-width: 100%;
	}

	.title p {
		font-size: var(--size-3);
		color: var(--text-2);
	}

	.tags {
		display: flex;
		gap: var(--size-2);
		margin-block: var(--size-3);
		flex-wrap: wrap;
		align-items: flex-start;
	}

	.tags span {
		padding-block: var(--size-1);
		padding-inline: var(--size-3);
		border-radius: var(--radius-round);
		background-color: var(--surface-4);
		color: var(--text-2);
	}
</style>
