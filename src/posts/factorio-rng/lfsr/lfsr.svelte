<script lang="ts">
	import { anchor } from '$lib/shapeutil';
	import { onMount } from 'svelte';
	import { Arrow, Xor, Bit, History, Controls } from './components';
	import { on } from 'svelte/events';

	interface Props {
		initialState?: number;
		tapMask?: number;
		bits?: number;
		reverse?: boolean;
		value?: number;
		hideOutput?: boolean;
		onStateChange?: (newValue: number) => void;
	}

	let {
		initialState = 1,
		tapMask = 0b110000,
		bits,
		reverse = false,
		value,
		hideOutput = false,
		onStateChange
	}: Props = $props();

	function highestBit(n: number) {
		return Math.floor(Math.log2(n));
	}

	let bitCount = $derived(Number(bits) || highestBit(tapMask) + 1);
	let lfsr = $state(value ?? initialState);

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
		} else {
			const feedback = (lfsr >> (bitCount - 1)) & 1; // Feedback is the first bit
			if (feedback) {
				lfsr ^= tapMask; // XOR feedback with tap bits
			}
			lfsr <<= 1; // Left shift
			lfsr &= (1 << bitCount) - 1; // Mask to bitCount bits
			lfsr |= feedback; // Insert feedback at the end
		}
	}

	function isTap(i: number) {
		return (tapMask >> (bitCount - i - 1)) & 1;
	}

	function step() {
		shiftLFSR();
		if (!reverse) {
			historyEl?.push();
		}
		onStateChange?.(lfsr);
	}

	function reset() {
		lfsr = initialState;
		if (!reverse) {
			historyEl?.reset();
			historyEl?.push();
		}
		onStateChange?.(lfsr);
	}

	function toggleBit(i: number) {
		lfsr ^= 1 << (bitCount - i - 1);
		onStateChange?.(lfsr);
	}

	function col(i: number) {
		return i ? 'var(--color-lit)' : 'var(--color-dim)';
	}

	const dx = 80;
	const r = 15;

	const fullViewBoxHeight = 84;
	const compactViewBoxHeight = 44;
	const fullContainerHeightEm = 5;

	let lfsrBits = $derived([...Array(bitCount).keys()].map((i) => (lfsr >> (bitCount - i - 1)) & 1));
	let currentBit = $derived(lfsr & 1);
	let viewBoxHeight = $derived(tapMask != 0 ? fullViewBoxHeight : compactViewBoxHeight);
	let viewBoxWidth = $derived(
			(bitCount-1) * dx        // bits
		+ 2*r                      // last bit radius
		+ 4                        // 2x margin
		+ (tapMask != 0 ? 20 : 0)  // feedback loop
		+ (!hideOutput ? dx + 60 : 0)
	)
	let containerHeight = $derived(
		`${(fullContainerHeightEm * viewBoxHeight) / fullViewBoxHeight}em`
	);
	let bitEls: SVGGraphicsElement[] = $state([]);
	let xorEls: SVGGraphicsElement[] = $state([]);
	let historyEl: History | undefined = $state();
</script>

<div class="container" style:height={containerHeight}>
	<svg viewBox="-17 -2 {viewBoxWidth} {viewBoxHeight}">
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
				{@const b = anchor(180, bitEls[0])}
				{@const t = anchor(90, bitEls[bitEls.length - 1])}
				{#if reverse}
					<path d="M {b} V 60 H {t[0]} h 20 V {t[1]} h -20" />
				{:else}
					<path d="M {t} h 20 V 60 H {b.join('V')}" />
				{/if}
			{/if}
			{#if !hideOutput}
				<path d="M {anchor(90, bitEls[bitEls.length - 1])} h 60" />
			{/if}
			{#each xorEls as el, i}
				{#if isTap(i + 1)}
					{@const a = anchor(180, el)}
					<path d="M {a[0]} 60 V {a[1]}" />
				{/if}
			{/each}
		</g>

		<!-- LFSR bits + inter mitten XORs -->
		{#each lfsrBits as bit, i}
			<Bit x={i * dx} y={r} r={r} set={!!bit} onclick={() => toggleBit(i)} bind:ref={bitEls[i]} />
			{#if i < lfsrBits.length - 1 && isTap(i + 1)}
				<Xor x={(i + 0.5) * dx} y={r} r={10} bind:ref={xorEls[i]} />
			{/if}
		{/each}

		<!-- History of output bits -->
		{#if !reverse && !hideOutput}
			<History bind:this={historyEl} x={bitCount * dx} y={r} current={currentBit} />
		{/if}
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
