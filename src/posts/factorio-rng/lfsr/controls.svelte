<script lang="ts">
	import { onMount } from 'svelte';
	import { RiPauseFill, RiPlayFill, RiSkipForwardFill } from 'svelte-remixicon';

	let isPlaying = false;
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

	export let tick: () => void;
</script>

<div class='controls'>
<button on:click={isPlaying ? stop : tick} class='surface-4'>
	<RiSkipForwardFill />
</button>
<button on:click={isPlaying ? stop : start} class='surface-4'>
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

button {
	box-shadow: unset;
	border: none;
	box-shadow: 0 0 10px -5px var(--stone-10) inset;
}
</style>