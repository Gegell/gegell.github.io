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
				<a href={id}>{value}</a>
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
		<nav class="toc" transition:fly={{ x: 100, duration: 400 }}>
			<h2>Table of Contents</h2>
			{@render tocList(headings)}
		</nav>
	{/if}
</div>

<style>
	.toc-sidebar {
		position: fixed;
		top: 0;
		right: 0;
		height: 100vh;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		background: var(--surface-1, #fff);
		box-shadow: var(--shadow-3, -2px 0 8px rgba(0, 0, 0, 0.08));
	}
	.toc-burger {
		margin: 1rem 1rem 0 0;
		background: none;
		border: none;
		cursor: pointer;
		z-index: 1001;
	}
	.toc {
		padding: 1rem 1.5rem;
		width: 100%;
		overflow-y: auto;
	}
	@media (max-width: 700px) {
		.toc-sidebar.open {
			width: 90vw;
		}
	}
</style>
