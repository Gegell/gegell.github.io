<script lang="ts">
	import { center, anchor, type Point } from '$lib/shapeutil';

	interface Props {
		from: SVGGraphicsElement;
		to: SVGGraphicsElement;
		color?: string;
	}

	let { from, to, color = 'black' }: Props = $props();

	interface Points {
		p1: Point;
		p2: Point;
	}
	let { p1, p2 }: Points = $derived.by(() => {
		if (from && to) {
			const fromCenter = center(from);
			const toCenter = center(to);

			const dx = toCenter[0] - fromCenter[0];
			const dy = toCenter[1] - fromCenter[1];

			const angle = (Math.atan2(dx, -dy) / Math.PI) * 180;

			return {
				p1: anchor(angle, from),
				p2: anchor(angle + 180, to)
			};
		} else {
			return { p1: [0, 0], p2: [0, 0] };
		}
	});
</script>

{#if from && to}
	<path stroke={color} stroke-width="1.75" fill="none" d="M {p1} L {p2}" marker-end="url(#arrow)" />
{/if}
