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
	<meta property="og:description" content={data.description} />
	{#if data.image}
		<meta property="og:image" content={data.image} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
	{/if}
</svelte:head>

<article class="columns">
	<!-- Middle column -->
	<!-- Title -->
	<div class="head">
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
	</div>

	<!-- Post content -->
	<div class="prose">
		<data.content />
	</div>

	<!-- Right column, mainly for toc -->
	<div class="toc">
		<!-- Table of Content TOC -->
		{#if data.showToc}
			<Toc headings={data.toc} />
		{/if}
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
		padding-block: var(--size-3);
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

	.columns {
		display: grid;
		grid-template-columns: 1fr minmax(0, 80ch) 1fr;
		grid-template-areas:
			'. content-head .'
			'left content-main right';
		gap: var(--size-7);
		max-inline-size: 100%;
		margin-inline: auto;
	}

	.head {
		grid-area: content-head;
	}
	.prose {
		grid-area: content-main;
	}
	.toc {
		grid-area: right;
	}

	/* TODO: Figure out why for really low resolution the width of the display is exceeded. */
	@media (max-width: 155ch) {
		.columns {
			display: block;
			max-inline-size: 80ch;
		}

		.head {
			margin-bottom: var(--size-7);
		}
	}
</style>
