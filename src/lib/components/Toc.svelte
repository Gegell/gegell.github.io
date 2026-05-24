<script lang="ts">
	import type { Toc } from '@stefanprobst/rehype-extract-toc';
	import RiMenuFill from 'svelte-remixicon/RiMenuFill.svelte';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let { headings = [] }: { headings?: Toc } = $props();
	let open = $state(true);
	let activeId = $state<string | null>(null);

	function toggleToc() {
		open = !open;
	}

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
		updateActiveSection();
		window.addEventListener('scroll', updateActiveSection);

		return () => {
			window.removeEventListener('scroll', updateActiveSection);
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

<div class="toc-sidebar {open ? 'open' : 'closed'}">
	<button
		class="toc-burger"
		onclick={toggleToc}
		aria-label="Toggle Table of Contents"
		aria-expanded={open}
		aria-controls="toc-nav"
	>
		<RiMenuFill size="28" />
	</button>
	{#if open}
		<!-- TODO: remove the snapping behaviour when hiding/showing the ToC -->
		<nav id="toc-nav" class="toc" transition:fly={{ x: 50, duration: 400 }}>
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
	}
	.toc-burger {
		background: var(--surface-4);
		display: block;
		border: none;
		cursor: pointer;
		margin-top: -0.75ch;
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
	@media (max-width: 155ch) {
		.toc-sidebar {
			position: fixed;
			inset-block-start: var(--size-10);
			inset-inline-end: var(--size-5);
			z-index: 20;
			width: min(fit-content, 100%);
		}

		.toc-burger {
			margin-inline-start: auto;
			margin-bottom: 0;
			box-shadow: var(--shadow-2);
		}

		.toc {
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
	}
</style>
