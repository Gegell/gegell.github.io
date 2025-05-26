<script lang="ts">
	import type { Toc } from '@stefanprobst/rehype-extract-toc';
	import { RiMenuFill } from 'svelte-remixicon';
	import { fly, slide } from 'svelte/transition';

	let { headings = [] }: { headings?: Toc } = $props();
	let open = $state(true);

	function toggleToc() {
		open = !open;
	}
</script>

{#snippet tocList(items: Toc)}
	<ol>
		{#each items as { id, value, children, depth }}
			<li>
				<a href={'#' + id}>{value}</a>
				{#if children && children.length > 0}
					{@render tocList(children)}
				{/if}
			</li>
		{/each}
	</ol>
{/snippet}

<div class="toc-sidebar {open ? 'open' : 'closed'}">
	<button class="toc-burger" onclick={toggleToc} aria-label="Toggle Table of Contents">
		<RiMenuFill size="28" />
	</button>
	{#if open}
  <!-- TODO: remove the snapping behaviour when hiding/showing the ToC -->
		<nav class="toc" transition:fly={{ x: 50, duration: 400 }}>
			{@render tocList(headings)}
		</nav>
	{/if}
</div>

<style>
	.toc-sidebar {
		position: sticky;
		top: var(--size-7);
    overflow: visible;
	}
	.toc-burger {
		background: var(--surface-4);
		border: none;
		cursor: pointer;
    margin-top: -.75ch;
    margin-bottom: var(--size-relative-7)
	}
	.toc {
		width: 100%;
	}

	ol {
		counter-reset: section;
		list-style-type: none;
		list-style-position: inside;
		padding-left: 0;
	}
	ol ol {
		padding-left: 1rem;
	}
	li::before {
		counter-increment: section;
		content: counters(section, '.') '. ';
	}
</style>
