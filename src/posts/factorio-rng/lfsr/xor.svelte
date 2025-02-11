<script lang="ts">
  export let x: number;
  export let y: number;
  export let r: number;
  export let stroke: string = 'black';
  export let strokeWidth: number = 1.75;
  export let fill: string = 'none';
  export let ref: SVGGraphicsElement | null = null;
</script>

<g {stroke} stroke-width={strokeWidth} {fill} bind:this={ref}>
	<circle cx={x} cy={y} {r} />
	<line x1={x-r} y1={y} x2={x + r} y2={y} />
	<line x1={x} y1={y-r} x2={x} y2={y + r} />
</g>
