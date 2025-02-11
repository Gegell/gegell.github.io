<script lang="ts">
	import { center, anchor } from '$lib/shapeutil';

	let p1 = [0, 0];
	let p2 = [0, 0];
	export let from: SVGGraphicsElement, to: SVGGraphicsElement;
	export let color = "black";

	$: {
		if (from && to) {
			// HACK: This position may get out of sync if the parent element changes size/position
			// as the HTML element properties are not reactive
			const fromCenter = center(from);
			const toCenter = center(to);
			
			const dx = toCenter[0] - fromCenter[0];
			const dy = toCenter[1] - fromCenter[1];
	
			const angle = Math.atan2(dx, dy) / Math.PI * 180;
	
			p1 = anchor(angle, from);
			p2 = anchor(angle + 180, to);
		}
	}
</script>

{#if from && to}
	<path stroke={color} stroke-width="1.75" fill="none" d="M {p1} L {p2}" marker-end="url(#arrow)" />
{/if}
