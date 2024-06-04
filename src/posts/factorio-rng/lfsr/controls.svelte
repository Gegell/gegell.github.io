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
<button on:click={isPlaying ? stop : tick}>
	<RiSkipForwardFill />
</button>
<button on:click={isPlaying ? stop : start}>
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
	background: none;
	border: none;
	cursor: pointer;
	box-shadow: unset;
	border: 1px solid var(--brand);
	color: var(--brand);
}
</style>