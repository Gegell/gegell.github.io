<script lang="ts">
	interface Props {
		x: number;
		y: number;
		r: number;
		ref?: SVGGraphicsElement;
	}

	let { x, y, r, ref = $bindable() }: Props = $props();
</script>

<g bind:this={ref}>
	<circle cx={x} cy={y} {r} />
	<line x1={x - r} y1={y} x2={x + r} y2={y} />
	<line x1={x} y1={y - r} x2={x} y2={y + r} />
</g>

<style>
	g {
		stroke-width: var(--stroke-width, 1.75);
		fill: var(--color-dim);
		fill-opacity: 0.4;
		stroke: var(--stroke, var(--color-dim));
	}
</style>
