<script lang="ts">
	import { fly } from 'svelte/transition';

	interface Props {
		x: number;
		y: number;
		r: number;
		ref?: SVGGraphicsElement;
		set?: Boolean;
		onclick?: () => void;
	}

	let { x, y, r, ref = $bindable(), set = false, onclick = () => {} }: Props = $props();

	let color = $derived(set ? 'var(--color-lit)' : 'var(--color-dim)');
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<g bind:this={ref} {onclick} role="button" cursor="pointer">
	<rect x={x - r} y={y - r} width={2 * r} height={2 * r} fill={color} stroke={color} rx={3} />
	{#if set}
		<text {x} {y} font-size={r} class="active" transition:fly={{ y: -r, duration: 50 }}>1</text>
	{:else}
		<text {x} {y} font-size={r} transition:fly={{y: r, duration: 50}}>0</text>
	{/if}
</g>

<style>
	rect {
		fill-opacity: 0.4;
		stroke-width: 1.75;
	}

	text {
		font-family: var(--font-mono);
		dominant-baseline: central;
		text-anchor: middle;
		fill: var(--color-dim);
		user-select: none;
	}

	text.active {
		fill: var(--color-lit);
	}
</style>
