<script lang="ts">
	interface Props {
		x: number;
		y: number;
		limit?: number;
	}

	let { x, y, limit = 10 }: Props = $props();
	let history: number[] = $state([]);
	let mutations: number = $state(0);

	export function push(bit: number) {
		mutations++;
		history.push(bit);
		if (history.length > limit) {
			history.shift();
		}
	}

  export function reset() {
    history = [];
    mutations = 0;
  }
</script>

<text {x} {y}>
	{#each history.toReversed() as bit}
		<tspan class:active={!!bit}>
			{bit}
		</tspan>
	{/each}{#if mutations > limit}
		<tspan>&hellip;</tspan>
	{/if}
</text>

<style>
	text {
		fill: var(--color-dim);
		font-family: var(--font-mono);
		font-size: 1em;
		dominant-baseline: central;
	}

	tspan.active {
		fill: var(--color-lit);
	}
</style>
