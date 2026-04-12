<script lang="ts">
  import TilesetIcon from './TilesetIcon.svelte';
  import { qualityTileset, qualityTilesetMap } from './tilesets';

  let { level, size = 20 }: { level: string; size?: number } = $props();
</script>

<TilesetIcon name={level} map={qualityTilesetMap} image={qualityTileset} {size} />
