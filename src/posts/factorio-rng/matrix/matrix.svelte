<script lang="ts">
	let data = $state(new Int8Array(32 * 32).map(() => (Math.random() > 0.5 ? 0 : 1)));

	const { gapSmall = 1, gapBig = 2, gapEvery = 16, size = 4 } = $props();
	const step = $derived(size + gapSmall);

	let viewBoxSize = $derived({
		width: 32 * step + Math.floor((32 - 1) / gapEvery) * gapBig,
		height: 32 * step + Math.floor((32 - 1) / gapEvery) * gapBig
	});
</script>

<svg
	viewBox={`0 0 ${viewBoxSize.width} ${viewBoxSize.height}`}
	width={viewBoxSize.width}
	height={viewBoxSize.height}
>
	{#each { length: 32 } as _, y}
		{#each { length: 32 } as _, x}
			{@const d = data[x + y * 32]}
			<rect
				x={x * step + Math.floor(x / gapEvery) * gapBig}
				y={y * step + Math.floor(y / gapEvery) * gapBig}
				class:active={d}
			></rect>
		{/each}
	{/each}
</svg>

<style>
	rect {
		width: 4px;
		height: 4px;
		rx: 1px;
		ry: 1px;
		fill: var(--surface-4, #222);
	}
	rect.active {
		fill: var(--brand, #f80);
	}
</style>
