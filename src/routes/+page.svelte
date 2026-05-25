<script lang="ts">
	import * as config from '$lib/config';
	import { base } from '$app/paths';
	import { dateFormat } from '$lib/util';

	let { data } = $props();
</script>

<svelte:head>
	<title>{config.title}</title>
</svelte:head>

<section>
	<ul class="posts">
		{#each data.posts as post}
		<li class="post-item">
			<a href="{base}/posts/{post.slug}" class="post">
				{#if post.image}
				<div class="thumbnail">
					<img src={post.image} alt={post.title} />
				</div>
				{/if}
				<div class="details">
					<h1 class="title">{post.title}</h1>
					<p class="date">{dateFormat(post.date)}</p>
					<p class="description">{post.description}</p>
				</div>
			</a>
		</li>
		{/each}
	</ul>
</section>

<style>
	section {
		max-width: 100ch;
		margin-inline: auto;
	}

	.posts {
		list-style: none;
		padding: 0;
	}

	.post-item {
		padding: 0;
		padding-block-end: var(--size-5);
		max-inline-size: unset;
	}

	.posts > .post-item + .post-item {
		padding-block-start: var(--size-5);
		border-top: 1px solid var(--border);
	}

	.post-item:last-child {
		padding-block-end: 0;
	}
	
	.post {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--size-5);
		justify-content: flex-start;
		align-items: flex-start;
		text-decoration: none;
	}

	.post .thumbnail {
		flex: 1 1 40ch;
		max-inline-size: 100%;
		min-inline-size: 20ch;
		max-width: 40ch;
	}

	.details {
		flex: 1 1 0;
		min-inline-size: 28ch;
	}

	.thumbnail > img {
		width: 100%;
		height: auto;
		border-radius: var(--size-2);
	}

	.title {
		font-size: var(--size-6);
		font-weight: bold;
		color: var(--brand);
		max-inline-size: 100%;
	}

	.date {
		color: var(--text-2);
		font-size: var(--size-3);
		font-style: italic;
	}

	.description {
		color: var(--text-2);
		margin-block: var(--size-2);
		max-inline-size: 100%;
	}
</style>
