<script lang="ts">
	import { slide } from 'svelte/transition';

	let { children } = $props();
	let open = $state(false);
	let contentEl: HTMLDivElement | null = $state(null);

	function toggleFoldout() {
		if (open && contentEl) {
      window.scrollBy({
				top: (() => {
					const top = contentEl.getBoundingClientRect().top;
					return top < 0 || top > window.innerHeight ? top : 0;
				})(),
        behavior: 'smooth'
      });
    }

		open = !open;
	}
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
	onclick={toggleFoldout}
	aria-label="toggle foldout"
>
	<svg viewBox="-2 2 24 24" xmlns="http://www.w3.org/2000/svg" height="2em" class:open>
		<path
			stroke="var(--text-1)"
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
		overflow-y: hidden;
		position: relative;
    /* Bounce out */
		/* transition: max-height 400ms cubic-bezier(0.18, 0.89, 0.32, 1.28); */
    /* Ease out */
    transition: max-height 400ms ease-out;
	}

  @keyframes bounce-button {
    0% { transform: translateY(0); }
    30% { transform: translateY(-5px) scaleX(0.7) scaleY(1.3); }
    50% { transform: translateY(2px) scaleX(1.1) scaleY(1); }
    70% { transform: translateY(-4px) scaleX(0.7) scaleY(1.2); }
    100% { transform: translateY(0); }
  }

	button {
		margin-inline: auto;
    box-shadow: none;
		display: block;
		padding: 0;
		border: none;
		background: none;
    animation-fill-mode: forwards;
	}

  button:hover {
    animation: bounce-button 800ms ease-in-out;
  }

	svg {
		transition: transform 400ms ease-out;
	}

	svg.open {
		transform: scaleY(-1);
	}
</style>
