<script lang="ts">
	import Arrow from './arrow.svelte';
	import Controls from './controls.svelte';
	import { anchor } from '$lib/shapeutil';
	import Xor from './xor.svelte';
	import Bit from './bit.svelte';
	
  let lfsr = 0b1000; // Initial state
  const tapMask = 0b110010; // Tap at the second bit
  const bitCount = highestBit(tapMask) + 1;

	function highestBit(n: number) {
		return Math.floor(Math.log2(n));
	}

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
		updateVisual();
  }

  function updateVisual() {
    const bits = [];
    for (let i = bitCount - 1; i >= 0; i--) {
			// Display MSB to LSB
      bits.push((lfsr >> i) & 1);
    }
    lfsrBits = bits;
  }

	function col(i: number) {
		return i ? 'var(--color-lit)' : 'var(--color-dim)';
	}

  let lfsrBits = [0, 0, 0, 0, 0, 0];
	let bitEls: SVGGraphicsElement[] = [];
	let xorEls: SVGGraphicsElement[] = [];
</script>

<div class="container">
	<svg viewBox="-2 -2 {(bitCount-.5) * 80 + 4} 84">
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
				{#if isTap(i+1)}
					<Arrow from={bitEls[i]} to={xorEls[i]} color={col(lfsrBits[i])} />
					<Arrow from={xorEls[i]} to={bitEls[i+1]} color={col(lfsrBits[i] ^ (lfsr & 1))} />
				{:else}
					<Arrow from={bitEls[i]} to={bitEls[i+1]} color={col(lfsrBits[i])} />
				{/if}
			{/if}
		{/each}
		<g
			stroke={col(lfsrBits[lfsrBits.length-1])}
			fill="none"
			stroke-width="1.75"
			marker-end="url(#arrow)"
		>
			<path
				d="M {anchor(90, bitEls[bitEls.length-1])} h 20 V 60 H {anchor(180, bitEls[0]).join('V')}"
			/>
			<path d="M {anchor(90, bitEls[bitEls.length-1])} h 60" />
			{#each xorEls as el, i}
				{#if isTap(i+1)}
					{@const a = anchor(180, el)}
					<path d="M {a[0]} 60 V {a[1]}" />
				{/if}
			{/each}
		</g>

		{#each lfsrBits as bit, i}
			<Bit x={i * 80} y={15} r={15} set={!!bit} bind:ref={bitEls[i]} />
			{#if i < lfsrBits.length - 1 && isTap(i+1)}
				<Xor x={i * 80 + 40} y={15} r={10} bind:ref={xorEls[i]} />
			{/if}
		{/each}
	</svg>
</div>
<Controls tick={step} />

<style>
	.container {
		position: relative;
		height: 5em;
		--color-lit: #fff;
		--color-dim: #0f0f0f;
	}
	
	.xor,
  .bit {
    width: 30px;
    height: 30px;
    border: 1px solid black;
		border-radius: 4px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    margin: 0 20px;
    position: relative;
		transition: 100ms;
		background-color: var(--color-dim);
		user-select: none;
  }

	.bit.lit {
		background-color: var(--color-lit);
		color: var(--color-dim);
		box-shadow: 0 0 10px 0px var(--color-lit);
		border-color: var(--color-lit);
	}

	.xor {
		border-radius: 9001em;
	}

	svg {
		width: 100%;
		height: 100%;
	}
</style>
