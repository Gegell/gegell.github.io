<script lang="ts">
	import { slide } from 'svelte/transition';

	let { children } = $props();
	let open = $state(false);
	let contentEl: HTMLDivElement | null = $state(null);
</script>

<div
	class="content-wrap"
	class:open
	style:max-height={open
		? `${contentEl?.scrollHeight}px` || 'var(--collapsed-height, 200px)'
		: 'var(--collapsed-height, 200px)'}
>
	<div class="content" bind:this={contentEl}>
		{#if children}
			{@render children()}
		{:else}
			<p>fallback content</p>
		{/if}
	</div>
	{#if !open}
		<div transition:slide={{ duration: 400 }} class="overlay"></div>
	{/if}
</div>

<!-- Custom arrow downwards -->
<button
	type="button"
	onclick={() => {
		open = !open;
	}}
	aria-label="toggle foldout"
>
	<svg viewBox="-2 2 24 24" xmlns="http://www.w3.org/2000/svg" height="2em" class:open>
		<path
			stroke="white"
			stroke-width="1pt"
			stroke-linejoin="round"
			stroke-linecap="round"
			fill="none"
			d="m 0 6 l 10 10 l 10 -10"
		/>
	</svg>
</button>

<style>
	.overlay {
		position: absolute;
		bottom: 0;
		width: 100%;
		height: 4em;
		background: linear-gradient(to bottom, transparent, var(--background));
		pointer-events: none;
	}

	.content-wrap {
		overflow: hidden;
		position: relative;
    /* Bounce out */
		/* transition: max-height 400ms cubic-bezier(0.18, 0.89, 0.32, 1.28); */
    /* Ease out */
    transition: max-height 400ms ease-out;
	}

	button {
		margin-inline: auto;
		display: block;
		padding: 0;
		border: none;
		background: none;
	}

	svg {
		transition: transform 0.2s;
	}

	svg.open {
		transform: scaleY(-1);
	}
</style>
