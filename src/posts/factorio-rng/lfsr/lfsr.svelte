<script lang="ts">
	import Arrow from './arrow.svelte';
	import Controls from './controls.svelte';
	import { anchor } from '$lib/shapeutil';
	
  let lfsr = 0b1000; // Initial state
  const tapMask = 0b1100; // Tap at the second bit
  const bitCount = 4;

  function shiftLFSR() {
    const feedback = lfsr & 1; // Feedback is the last bit
    lfsr >>>= 1; // Right shift
    if (feedback) {
      lfsr ^= tapMask; // XOR feedback with tap bits
    }
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
		return i ? 'var(--color-lit)' : 'black';
	}

  let lfsrBits = [1, 0, 0, 0]; // Initial bit values - TODO: Make it only derived from lfsr
	let bitEls: HTMLElement[] = [];
	let xorEls: HTMLElement[] = [];
</script>

<div class="container">
	<svg xmlns="http://www.w3.org/2000/svg">
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
			  <Arrow from={bitEls[i]} to={xorEls[i]} color={col(lfsrBits[i])}/>
			  <Arrow from={xorEls[i]} to={bitEls[i+1]} color={col(lfsrBits[i] ^ ((lfsr & 1) & (tapMask >> (lfsrBits.length - 2 - i))))}/>
			{/if}
	  {/each}
		<g stroke={col(lfsrBits[lfsrBits.length-1])} fill="none" stroke-width="1.75" marker-end="url(#arrow)">
			<path d="M {anchor(90, bitEls[bitEls.length-1])} h 20 v 50 H {anchor(180, bitEls[0]).join('V')}"/>
			<path d="M {anchor(90, bitEls[bitEls.length-1])} h 47.5"/>
			{#each xorEls as el, i}
				{#if (tapMask >> (bitCount - i - 2)) & 1}
					<path d="M {anchor(180, el)} m 0 35 v -35"/>
				{/if}
			{/each}
		</g>
	</svg>
	
	<div style="display: flex; align-items: center; justify-content: center;">
	  {#each lfsrBits as bit, i}
	    <div class="bit {bit ? 'lit' : ''}" bind:this={bitEls[i]}>
	      {bit}
	    </div>
			{#if i < lfsrBits.length - 1}
	    <div class="xor" bind:this={xorEls[i]}></div>
			{/if}
	  {/each}
	</div>
</div>
<Controls tick={step}/>


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
		position: absolute; 
		width: 100%;
		z-index: -1;
	}
</style>
