<script lang="ts">
	import { anchor } from '$lib/shapeutil';
	import { onMount } from 'svelte';
	import katex from 'katex';
	import { Arrow, Xor, Bit, Controls } from './components';

	interface Props {
		initialState?: number;
		tapMask?: number;
		bits?: number;
		reverse?: boolean;
		value?: number;
		onStateChange?: (newValue: number) => void;
	}

	let {
		initialState = 1,
		tapMask = 0b110000,
		bits,
		reverse = false,
		value,
		onStateChange
	}: Props = $props();

	function highestBit(n: number) {
		return Math.floor(Math.log2(n));
	}

	let bitCount = $derived(Number(bits) || highestBit(tapMask) + 1);
	let lfsr = $state(value ?? initialState);
	let manualSetInitialState = $state(initialState);
	let stepsTaken = $state(0);
	let symbolicBits: number[] = $state([]);

	$effect(() => {
		if (value !== undefined) {
			lfsr = value;
		}
	});

	onMount(reset);

	function shiftLFSR() {
		if (!reverse) {
			const feedback = lfsr & 1; // Feedback is the last bit
			lfsr >>>= 1; // Right shift
			if (feedback) {
				lfsr ^= tapMask; // XOR feedback with tap bits
			}
			// Symbolic part
			symbolicBits = symbolicBits.map((_, i) => {
				if (i === 0) {
					return symbolicBits[bitCount - 1];
				} else if (isTap(i)) {
					return symbolicBits[i - 1] ^ symbolicBits[bitCount - 1];
				} else {
					return symbolicBits[i - 1];
				}
			});
		} else {
			const feedback = (lfsr >> (bitCount - 1)) & 1; // Feedback is the first bit
			if (feedback) {
				lfsr ^= tapMask; // XOR feedback with tap bits
			}
			lfsr <<= 1; // Left shift
			lfsr &= (1 << bitCount) - 1; // Mask to bitCount bits
			lfsr |= feedback; // Insert feedback at the end
			// Symbolic part
			symbolicBits = symbolicBits.map((_, i) => {
				if (i === bitCount - 1) {
					return symbolicBits[0];
				} else if (isTap(i)) {
					return symbolicBits[i + 1] ^ symbolicBits[0];
				} else {
					return symbolicBits[i + 1];
				}
			});
		}
	}

	function isTap(i: number) {
		return (tapMask >> (bitCount - i - 1)) & 1;
	}

	function step() {
		shiftLFSR();
		onStateChange?.(lfsr);
		stepsTaken++;
	}

	function reset() {
		if (lfsr == manualSetInitialState) {
			lfsr = initialState;
			manualSetInitialState = initialState;
		} else {
			lfsr = manualSetInitialState;
		}
		onStateChange?.(lfsr);
		stepsTaken = 0;
		symbolicBits = Array(bitCount).fill(0).map((_, i) => 1 << i);
	}

	function toggleBit(i: number) {
		// Only if all symbolic bits are standalone allow toggling, check if any has multiple bits set
		if (symbolicBits.some((bits) => (bits & (bits - 1)) != 0))
			return;
		manualSetInitialState ^= 1 << (bitCount - i - 1);
		reset();
	}

	function col(i: number) {
		return i ? 'var(--color-lit)' : 'var(--color-dim)';
	}

	const fullViewBoxHeight = 84;
	const fullContainerHeightEm = 5;

	let lfsrBits = $derived([...Array(bitCount).keys()].map((i) => (lfsr >> (bitCount - i - 1)) & 1));
	let viewBoxWidth = 40;
	let containerHeight = $derived(
		`${(fullContainerHeightEm * bitCount * 2 * viewBoxWidth) / fullViewBoxHeight}em`
	);
	let bitEls: SVGGraphicsElement[] = $state([]);
	let xorEls: SVGGraphicsElement[] = $state([]);
</script>

{#snippet symbolicRepresentation(bits: number)}
	<!-- Iterate over all set bits of the bit at index bit_idx write string as x_0 \oplus ... x_k -->
	{@const setBitIndices = [...Array(bitCount).keys()].filter(
		(i) => (bits >> (bitCount - i - 1)) & 1
	)}
	<tspan fill="var(--color-dim)">=</tspan>
	{#each setBitIndices as bit, idx}
		{#if idx > 0}
			<tspan dx="2" dy="-4" fill="var(--color-dim)" font-family="Katex_Main, serif"> ⊕ </tspan>
		{/if}
		{@const origState = (manualSetInitialState >> bit) & 1}
		<tspan dx={idx == 0 ? 10 : 2} fill={col(origState)} font-family="KaTeX_Math, serif" font-style="italic">
			x<tspan dy="4" font-size=".8rem">{bit}</tspan>
		</tspan>
	{/each}
{/snippet}

<div class="container" style:height={containerHeight}>
	<svg viewBox="58 -2 {viewBoxWidth} {(bitCount - 0.5) * 80 + 4}">
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
					<Arrow
						from={reverse ? xorEls[i] : bitEls[i]}
						to={reverse ? bitEls[i] : xorEls[i]}
						color={col(lfsrBits[reverse ? i + 1 : i] ^ (reverse ? lfsr >>> (bitCount - 1) : 0))}
					/>
					<Arrow
						from={reverse ? bitEls[i + 1] : xorEls[i]}
						to={reverse ? xorEls[i] : bitEls[i + 1]}
						color={col(lfsrBits[reverse ? i + 1 : i] ^ (reverse ? 0 : lfsr & 1))}
					/>
				{:else}
					<Arrow
						from={reverse ? bitEls[i + 1] : bitEls[i]}
						to={reverse ? bitEls[i] : bitEls[i + 1]}
						color={col(lfsrBits[reverse ? i + 1 : i])}
					/>
				{/if}
			{/if}
		{/each}
		<g
			stroke={col(reverse ? lfsrBits[0] : lfsrBits[lfsrBits.length - 1])}
			fill="none"
			stroke-width="1.75"
			marker-end="url(#arrow)"
		>
			{#if tapMask != 0}
				{@const b = anchor(270, bitEls[0])}
				{@const t = anchor(270, bitEls[bitEls.length - 1])}
				{#if reverse}
					<path d="M {b} h -20 V {t[1]} H {t[0]}" />
				{:else}
					<path d="M {t} h -20 V {b[1]} H {b[0]}" />
				{/if}
			{/if}
			{#each xorEls as el, i}
				{#if isTap(i + 1)}
					{@const a = anchor(270, el)}
					<path d="M -20 {a[1]} H {a[0]}" />
				{/if}
			{/each}
		</g>

		<!-- LFSR bits + inter mitten XORs -->
		{#each lfsrBits as bit, i}
			<Bit
				x={15}
				y={i * 80 + 15}
				r={15}
				set={!!bit}
				onclick={() => toggleBit(i)}
				bind:ref={bitEls[i]}
			/>
			{#if i < lfsrBits.length - 1 && isTap(i + 1)}
				<Xor x={15} y={i * 80 + 55} r={10} bind:ref={xorEls[i]} />
			{/if}
		{/each}

		<!-- Symbolic representation -->
		{#each symbolicBits as bits, i}
			<text x="45" y={i * 80 + 20}>
				{@render symbolicRepresentation(bits)}
			</text>
		{/each}
	</svg>
</div>
<Controls tick={step} {reset} />

<style>
	.container {
		position: relative;
		--color-lit: var(--brand);
		--color-dim: var(--text-1);
	}

	svg {
		width: 100%;
		height: 100%;
		stroke-width: 1.75;
	}
</style>
