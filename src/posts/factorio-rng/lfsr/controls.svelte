<script lang="ts">
	import { onMount } from 'svelte';
	import { RiPauseFill, RiPlayFill, RiResetLeftFill, RiSkipForwardFill } from 'svelte-remixicon';

	let isPlaying = $state(false);
	let interval: number | undefined;

	function start() {
		isPlaying = true;
		interval = setInterval(tick, 1000);
	}

	function stop() {
		isPlaying = false;
		clearInterval(interval);
	}

	onMount(() => {
		return stop;
	});

	interface Props {
		tick: () => void;
		reset?: () => void;
	}

	let { tick, reset }: Props = $props();
</script>

<div class='controls'>
{#if reset}
<button onclick={() => {stop(); reset();}} class='surface-4 reset'>
	<RiResetLeftFill />
</button>
{/if}
<button onclick={isPlaying ? stop : tick} class='surface-4'>
	<RiSkipForwardFill />
</button>
<button onclick={isPlaying ? stop : start} class='surface-4'>
	{#if isPlaying}
		<RiPauseFill />
	{:else}
		<RiPlayFill />
	{/if}
</button>
</div>

<style>
.controls {
	display: flex;
	justify-content: center;
	gap: var(--size-relative-2);
}

:global(svg.ri-reset-left-fill) {
	transform: scale(.9);
}

button {
	box-shadow: unset;
	border: none;
	box-shadow: 0 0 10px -5px var(--stone-10) inset;
}
</style>