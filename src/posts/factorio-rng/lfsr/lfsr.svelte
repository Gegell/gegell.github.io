<script lang="ts">
	import { anchor } from '$lib/shapeutil';
	import { onMount } from 'svelte';
	import { Arrow, Xor, Bit, History, Controls } from './components';

	interface Props {
		initialState?: number;
		tapMask?: number;
	}

	let { initialState = 1, tapMask = 0b110000 }: Props = $props();

	function highestBit(n: number) {
		return Math.floor(Math.log2(n));
	}

	let bitCount = $derived(highestBit(tapMask) + 1);
	let lfsr = $state(initialState);

	onMount(reset);

	function shiftLFSR() {
		const feedback = lfsr & 1; // Feedback is the last bit
		lfsr >>>= 1; // Right shift
		if (feedback) {
			lfsr ^= tapMask; // XOR feedback with tap bits
		}
	}

	function isTap(i: number) {
		return (tapMask >> (bitCount - i - 1)) & 1;
	}

	function step() {
		shiftLFSR();
		historyEl.push(lfsr & 1);
	}

	function reset() {
		lfsr = initialState;
		historyEl.reset();
		historyEl.push(lfsr & 1);
	}

	function toggleBit(i: number) {
		lfsr ^= 1 << (bitCount - i - 1);
	}

	function col(i: number) {
		return i ? 'var(--color-lit)' : 'var(--color-dim)';
	}

	let lfsrBits = $derived([...Array(bitCount).keys()].map((i) => (lfsr >> (bitCount - i - 1)) & 1));
	let bitEls: SVGGraphicsElement[] = $state([]);
	let xorEls: SVGGraphicsElement[] = $state([]);
	let historyEl: History;
</script>

<div class="container">
	<svg viewBox="-2 -2 {(bitCount - 0.5) * 80 + 4} 84">
		<defs>
			<marker id="circle" markerWidth="8" markerHeight="8" refX="5" refY="5">
				<circle cx="5" cy="5" r="2" fill="context-stroke" />
			</marker>
			<marker id="arrow" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
				<path d="M 0 0 L 5 2.5 L 0 5 z" fill="context-stroke" />
			</marker>
		</defs>
		{#each bitEls as el, i}
			{#if i < bitEls.length - 1}
				{#if isTap(i + 1)}
					<Arrow from={bitEls[i]} to={xorEls[i]} color={col(lfsrBits[i])} />
					<Arrow from={xorEls[i]} to={bitEls[i + 1]} color={col(lfsrBits[i] ^ (lfsr & 1))} />
				{:else}
					<Arrow from={bitEls[i]} to={bitEls[i + 1]} color={col(lfsrBits[i])} />
				{/if}
			{/if}
		{/each}
		<g
			stroke={col(lfsrBits[lfsrBits.length - 1])}
			fill="none"
			stroke-width="1.75"
			marker-end="url(#arrow)"
		>
			<path
				d="M {anchor(90, bitEls[bitEls.length - 1])} h 20 V 60 H {anchor(180, bitEls[0]).join('V')}"
			/>
			<path d="M {anchor(90, bitEls[bitEls.length - 1])} h 60" />
			{#each xorEls as el, i}
				{#if isTap(i + 1)}
					{@const a = anchor(180, el)}
					<path d="M {a[0]} 60 V {a[1]}" />
				{/if}
			{/each}
		</g>

		<!-- LFSR bits + inter mitten XORs -->
		{#each lfsrBits as bit, i}
			<Bit x={i * 80} y={15} r={15} set={!!bit} onclick={() => toggleBit(i)} bind:ref={bitEls[i]} />
			{#if i < lfsrBits.length - 1 && isTap(i + 1)}
				<Xor x={i * 80 + 40} y={15} r={10} bind:ref={xorEls[i]} />
			{/if}
		{/each}

		<!-- History of output bits -->
		<History bind:this={historyEl} x={bitCount * 80} y={15} />
	</svg>
</div>
<Controls tick={step} {reset} />

<style>
	.container {
		position: relative;
		height: 5em;
		--color-lit: var(--brand);
		--color-dim: var(--text-1);
	}

	svg {
		width: 100%;
		height: 100%;
		stroke-width: 1.75;
	}
</style>
