<script lang="ts">
	const { src, width = 96, height = 32 } = $props();

	const uid = $props.id();
	const activeMask = `active-mask-${uid}`;
	const inactiveMask = `inactive-mask-${uid}`;
	const offPixels = `off-pixel-pattern-${uid}`;
	const onPixels = `on-pixel-pattern-${uid}`;
</script>

<svg viewBox="0 0 {6 * width} {6 * height}" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<pattern id={offPixels} width="6" height="6" x="0.5" y="0.5" patternUnits="userSpaceOnUse">
			<rect width="5" height="5" rx="1" ry="1" fill="var(--px-inactive)" />
		</pattern>
		<pattern id={onPixels} width="6" height="6" x="0.5" y="0.5" patternUnits="userSpaceOnUse">
			<rect width="5" height="5" rx="1" ry="1" fill="var(--px-active)" />
		</pattern>
	</defs>
	<mask id={activeMask}>
		<image href={src} width={6 * width} height={6 * height} />
	</mask>
	<mask id={inactiveMask}>
		<image href={src} width={6 * width} height={6 * height} style="filter: invert(100%);" />
	</mask>
	<rect
		width={6 * width}
		height={6 * height}
		fill={`url(#${offPixels})`}
		mask={`url(#${inactiveMask})`}
	/>
	<rect
		width={6 * width}
		height={6 * height}
		fill={`url(#${onPixels})`}
		mask={`url(#${activeMask})`}
	/>
</svg>

<style>
	image {
		image-rendering: crisp-edges;
	}

	svg {
    --px-active: var(--color-active, var(--brand, #f80));
    --px-inactive: var(--color-inactive, var(--surface-4, #222));
		width: var(--pmatrix-width, 100%);
	}
</style>
