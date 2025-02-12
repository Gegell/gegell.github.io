<script lang="ts">
	interface Props {
		x: number;
		y: number;
		r: number;
		ref?: SVGGraphicsElement;
		set?: Boolean;
	}

	let { x, y, r, ref = $bindable(), set = false }: Props = $props();

	let color = $derived(set ? 'var(--color-lit)' : 'var(--color-dim)');
</script>

<g bind:this={ref}>
	<rect x={x - r} y={y - r} width={2 * r} height={2 * r} fill={color} stroke={color} rx={3} />
	<text {x} {y} font-size={r} class:active={set}>
		{set ? '1' : '0'}
	</text>
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
