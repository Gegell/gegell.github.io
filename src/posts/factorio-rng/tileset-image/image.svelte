<script lang="ts" module>
	export { qualityIcon };
</script>

{#snippet qualityIcon(level: string)}
	<span class="tile quality {level} sm"></span>
{/snippet}

<style>
	:global {
		.tile {
			position: relative;
			display: inline-block;
      width: 32px;
      height: 32px;
		}
    .tile.sm {
      width: 20px;
      height: 20px;
    }
    .tile.sm::before {
      top: -6px;
      left: -6px;
    }

		.tile::before {
			position: absolute;
			top: 0;
			left: 0;
			transform: scale(0.5);
			transform-origin: 0 0;
			width: 64px;
			height: 64px;
			text-align: end;
			content: '';
			pointer-events: none;
		}
		.tile:hover {
			cursor: pointer;
		}
		.tile:active {
			transform: scale(0.95);
		}
		.tile:focus {
			outline: none;
		}

		/* Specific quality tiles */
		.tile.quality::before {
			background-image: url('quality-tileset.png');
			background-position: calc(-64px * var(--tile-x)) calc(-64px * var(--tile-y));
		}
		.tile.quality.normal {
			--tile-x: 0;
			--tile-y: 0;
		}
		.tile.quality.uncommon {
			--tile-x: 1;
			--tile-y: 0;
		}
		.tile.quality.rare {
			--tile-x: 2;
			--tile-y: 0;
		}
		.tile.quality.epic {
			--tile-x: 3;
			--tile-y: 0;
		}
		.tile.quality.legendary {
			--tile-x: 4;
			--tile-y: 0;
		}
	}
</style>
