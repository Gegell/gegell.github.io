<script lang="ts">
	import type { Toc } from '@stefanprobst/rehype-extract-toc';
	import { mobileToc } from '$lib/mobile.svelte';
	import { toc } from '$lib/toc.svelte';
	import TocToggleButton from '$lib/components/TocToggleButton.svelte';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let { headings = [] }: { headings?: Toc } = $props();
	let activeId = $state<string | null>(null);
	let mounted = $state(false);

	$effect(() => {
		if (mobileToc.matches) {
			toc.open = false;
		}
	});

	function updateActiveSection() {
		// Get all headings on the page
		const headingElements = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
		let current = null;

		// Find the heading closest to the top of the viewport
		for (const heading of headingElements) {
			// TODO: use IntersectionObserver for better performance?
			const rect = heading.getBoundingClientRect();
			if (rect.top <= 100) {
				current = heading.id;
			} else {
				break;
			}
		}

		activeId = current;
	}

	onMount(() => {
		toc.available = true;
		toc.open = !mobileToc.matches;
		updateActiveSection();
		window.addEventListener('scroll', updateActiveSection);

		mounted = true;

		return () => {
			window.removeEventListener('scroll', updateActiveSection);
			toc.available = false;
		};
	});
</script>

{#snippet tocList(items: Toc)}
	<ol>
		{#each items as { id, value, children, depth }}
			<li>
				<a href={'#' + id} class={activeId === id ? 'active' : ''}>{value}</a>
				{#if children && children.length > 0}
					{@render tocList(children)}
				{/if}
			</li>
		{/each}
	</ol>
{/snippet}

<div
	class="toc-sidebar {toc.open ? 'open' : 'closed'} {mounted ? 'mounted' : ''}"
	class:narrow={mobileToc.matches}
>
	<TocToggleButton class="toc-burger" />
	{#if toc.open}
		<!-- TODO: remove the snapping behaviour when hiding/showing the ToC -->
		<nav id="toc-nav" class="toc" transition:fly={{ y: -8, duration: 200 }}>
			{@render tocList(headings)}
		</nav>
	{/if}
</div>

<style>
	.toc-sidebar {
		position: sticky;
		top: var(--size-10);
		overflow: visible;
		align-self: start;
		z-index: 200;
	}
	:global(.toc-burger) {
		margin-top: -0ch;
		margin-bottom: var(--size-relative-7);
	}
	.toc {
		width: 100%;
	}

	ol {
		counter-reset: section;
		list-style-type: none;
		padding-left: 0;
	}

	li {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		column-gap: 0.35rem;
		align-items: start;
	}

	li::before {
		counter-increment: section;
		content: counters(section, '.') '. ';
	}
	li > ol {
		grid-column: 2;
	}

	a {
		display: block;
		min-width: 0;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	a:hover {
		text-decoration: underline;
	}

	a.active {
		color: var(--link-color, currentColor);
	}

	/* TODO: This is a jank way to switch between the different layouts and was only tested with my one singular post.
	   Might need to be adjusted later. */
	.toc-sidebar.narrow {
		position: fixed;
		inset-block-start: var(--size-10);
		inset-inline-end: var(--size-5);
		width: min(fit-content, 100%);
	}

	.toc-sidebar.narrow :global(.toc-burger) {
		display: none;
		margin-inline-start: auto;
		margin-bottom: 0;
		box-shadow: var(--shadow-2);
	}

	.toc-sidebar.narrow .toc {
		display: none;
		margin-top: var(--size-3);
		max-block-size: calc(100dvh - var(--size-12));
		overflow: auto;
		padding: var(--size-4);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-3);
		box-shadow: var(--shadow-5);
		backdrop-filter: blur(12px);
	}

	.toc-sidebar.narrow.mounted .toc {
		display: block;
	}
</style>
