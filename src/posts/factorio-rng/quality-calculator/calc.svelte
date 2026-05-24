<script lang="ts">
	import { TilesetIcon, qualityTileset, qualityTilesetMap } from '../tileset-image';

	type Quality = {
		name: string;
		icon: string;
		nextChance: number;
	};

	// TODO: Add icons for each quality
	const qualities = [
		{ name: 'normal', nextChance: 0.1 },
		{ name: 'uncommon', nextChance: 0.1 },
		{ name: 'rare', nextChance: 0.1 },
		{ name: 'epic', nextChance: 0.1 },
		{ name: 'legendary', nextChance: 0 }
	] as Quality[];

	let startQuality = $state(0);
	let qualityBonusPercentInput = $state(24.8);
	let qualityBonusPercent = $derived(Math.max(qualityBonusPercentInput, 0));

	let prob_thresholds = $derived.by(() => {
		let thresholds = Array(qualities.length).fill(null);
		let targetThreshold = qualityBonusPercent / 100; 
		for (let i = startQuality; i < qualities.length; i++) {
			thresholds[i] = targetThreshold;
			if (qualityBonusPercent === 0) break;
			targetThreshold *= qualities[i].nextChance;
		}
		return thresholds;
	});

	function intThreshold(prob_thresh: number) {
		if (prob_thresh === null) return '-';
		const int_thresh = Math.floor(prob_thresh * (2**32 - 1));
		const num = Intl.NumberFormat('en-US').format(int_thresh);
		return prob_thresh < 1 ? num : `(${num})`;
	}

	function probThresholdToProb(idx: number) {
		const [prev, cur] = [
			prob_thresholds[idx - 1] ?? 1,
			prob_thresholds[idx],
		];
		if (idx < qualities.length - 1) {
			// Probability that we are lower than the first but >= the second
			return Math.min(prev, 1) - Math.min(cur, 1);
		} else {
			// Probability that we are lower than the first for the last (no next follows)
			return Math.min(prev, 1);
		}
	}

	function fmtProb(prob: number) {
		return (prob === null)
			? '-'
			: Intl.NumberFormat('en-US', {
					style: 'percent',
					maximumFractionDigits: 3,
					minimumFractionDigits: 3
				}).format(prob);
	}
</script>

<!-- Inputs Box -->
<div class="inputs-box">
	<label class="input-label" for="startingQuality">Starting Quality:</label>
	<div class="quality-btn-group" id="startingQuality">
		{#each qualities as quality, i}
			<button
				type="button"
				class:selected={startQuality === i}
				onclick={() => (startQuality = i)}
				aria-label={quality.name}
			>
				<TilesetIcon name={quality.name} map={qualityTilesetMap} image={qualityTileset} size={20} />
			</button>
		{/each}
	</div>
	<label class="input-label" for="qualityPercentage">Quality Bonus (%):</label>
	<input
		id="qualityPercentage"
		type="number"
		bind:value={qualityBonusPercentInput}
		min="-3276.8"
		max="3276.7"
		step="0.1"
		class="quality-input"
	/>
</div>

<!-- Output table: Quality level | Percentage to roll this level | UInt threshold -->
<table>
	<thead>
		<tr>
			<th>Result</th>
			<th>Probability</th>
			<th><code>uint32_t</code> Threshold</th>
		</tr>
	</thead>
	<tbody>
		{#each qualities as quality, i}
			{@const prob_thresh = prob_thresholds[i]}
			<tr>
				<td><TilesetIcon name={quality.name} map={qualityTilesetMap} image={qualityTileset} size={20} /></td>
				<td class="int-col"
					>{prob_thresh === null ? '-' : fmtProb(probThresholdToProb(i))}</td
				>
				<td class="int-col">{intThreshold(prob_thresh)}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.inputs-box {
		margin-inline: auto;
		display: grid;
		grid-template-columns: max-content 1fr;
		align-items: baseline;
		gap: var(--size-3, 1rem);
		padding: var(--size-3, 1rem);
		background-color: var(--surface-2);
		border-radius: 0.75rem;
		box-shadow: var(--shadow-3);
		max-width: 520px;
	}

	.input-label {
		font-weight: 600;
		min-width: 140px;
	}

	.quality-input {
		width: 100px;
		padding: 0.4rem 0.6rem;
		border-radius: 0.4rem;
		border: 1px solid var(--surface-4, #ccc);
		background: var(--surface-1, #fff);
		font-size: 1rem;
	}

	.quality-btn-group {
		display: flex;
		gap: 0.5rem;
		padding: 0;
		background: none;
		border-radius: 0;
		flex-wrap: wrap;
	}

	.quality-btn-group button {
		border: 2px solid transparent;
		background: var(--surface-1, #222);
		border-radius: 0.5rem;
		padding: 0.5rem 0.5rem;
		cursor: pointer;
		transition:
			border 0.15s,
			background 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
		outline: none;
	}

	.quality-btn-group button.selected,
	.quality-btn-group button:focus {
		border: 2px solid var(--brand, #ff00ff);
		background: var(--surface-3, #333);
	}

	.quality-btn-group button:hover:not(.selected) {
		border: 2px solid var(--surface-4, #888);
	}

	.int-col {
		text-align: right;
		font-family: monospace;
	}
</style>
