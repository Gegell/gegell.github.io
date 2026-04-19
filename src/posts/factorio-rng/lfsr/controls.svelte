<script lang="ts">
	import { onMount } from 'svelte';
	import RiPauseFill from 'svelte-remixicon/RiPauseFill.svelte';
	import RiPlayFill from 'svelte-remixicon/RiPlayFill.svelte';
	import RiResetLeftFill from 'svelte-remixicon/RiResetLeftFill.svelte';
	import RiSkipForwardFill from 'svelte-remixicon/RiSkipForwardFill.svelte';
	import { controls } from './shared.svelte';

	const speed_multipliers = [1, 2, 5];
	const base_speed = 500;
	const uid = $props.id();

	let selected_mult: number = $state(0);
	let last_selected: number = 0;
	let isPlaying = $derived(selected_mult > 0);

	let interval: number | undefined;
	$effect(() => {
		clearInterval(interval);
		if (selected_mult) {
			last_selected = selected_mult;
			controls.playing_id = uid;
			interval = setInterval(tick, base_speed / selected_mult);
		}
	});

	$effect(() => {
		if (controls.playing_id !== uid) {
			stop();
		}
	});

	function start() {
		selected_mult = selected_mult || last_selected || 1;
	}

	function stop() {
		selected_mult = 0;
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

<div class="controls">
	<!-- Reset -->
	{#if reset}
		<button
			onclick={() => {
				stop();
				reset();
			}}
			class="surface-4 reset"
		>
			<RiResetLeftFill />
		</button>
	{/if}

	<!-- Single Step -->
	<button onclick={isPlaying ? stop : tick} class="surface-4">
		<RiSkipForwardFill />
	</button>

	<!-- Play / Pause -->
	<button onclick={isPlaying ? stop : start} class="surface-4">
		{#if isPlaying}
			<RiPauseFill />
		{:else}
			<RiPlayFill />
		{/if}
	</button>

	<!-- Speeds -->
	{#each speed_multipliers as mult}
		<label>
			<input type="radio" name="speed" value={mult} bind:group={selected_mult} />
			<span>{mult}x</span>
		</label>
	{/each}
</div>

<style>
	.controls {
		display: flex;
		justify-content: center;
		gap: var(--size-relative-2);
		margin-top: 0;
	}

	:global(svg.ri-reset-left-fill) {
		transform: scale(0.9);
	}

	button {
		box-shadow: unset;
		border: none;
		box-shadow: 0 0 10px -5px var(--stone-10) inset;
	}

	input[type='radio'] {
		display: none;
	}

	label {
		cursor: pointer;
		height: fit-content;
		align-self: center;
	}

	label > span {
		color: var(--text-1);
		opacity: 0.5;
	}

	label > :checked + span {
		opacity: 1;
		text-shadow: 0 0 5px var(--text-1);
	}
</style>
