<script lang="ts">
	import { toc } from '$lib/toc.svelte';
	import RiMenuFill from 'svelte-remixicon/RiMenuFill.svelte';

	let {
		class: className = ''
	}: {
		class?: string;
	} = $props();
</script>

<button
	class="toc-toggle {className}"
	onclick={() => toc.toggle()}
	aria-label="Toggle Table of Contents"
	aria-expanded={toc.open}
	aria-controls="toc-nav"
>
	<RiMenuFill size="28" />
</button>

<style>
	.toc-toggle {
		background: var(--surface-4);
		display: grid;
		place-items: center;
		border: none;
		cursor: pointer;
	}
</style>
