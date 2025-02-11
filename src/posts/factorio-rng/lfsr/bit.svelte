<script lang="ts">
  export let x: number;
  export let y: number;
  export let r: number;
  export let ref: SVGGraphicsElement | null = null;

  export let set: Boolean = false;

  $: color = set ? 'var(--color-lit)' : 'var(--color-dim)';
</script>

<g bind:this={ref}>
	<rect
		x={x - r}
		y={y - r}
		width={2 * r}
		height={2 * r}
		fill={color}
		stroke={color}
	/>
	<text
		{x}
		{y}
		font-size={r}
		class:active={set}
	>
		{set ? '1' : '0'}
	</text>
</g>

<style>
  rect {
    fill-opacity: 0.5;
    stroke-width: 1.75;
  }

  text {
    font-family: var(--font-mono);
    dominant-baseline: middle;
    text-anchor: middle;
    fill: var(--color-lit);
  }

  text.active {
    fill: var(--color-dim);
  }
</style>
