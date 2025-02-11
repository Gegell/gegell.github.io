<script lang="ts">
	import * as config from '$lib/config';
	import { base } from '$app/paths';
	import { dateFormat } from '$lib/util';

	export let data;
</script>

<svelte:head>
	<title>{config.title}</title>
</svelte:head>

<section>
	<ul class="posts">
		{#each data.posts as post}
			<li class="post">
				<a href="{base}/posts/{post.slug}" class="title">{post.title}</a>
				<p class="date">{dateFormat(post.date)}</p>
				<p class="description">{post.description}</p>
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

	.post {
		margin-block: var(--size-3);
	}

	.post:not(:first-child) {
    padding-block: var(--size-3);
		border-top: 1px solid var(--border);
	}

	.title {
		font-size: var(--size-6);
		font-weight: bold;
		padding-block: var(--size-3);
		color: var(--brand);
		text-decoration: none;
	}

	.date {
		color: var(--text-2);
	}

	.description {
		color: var(--text-2);
	}
</style>
