<script lang="ts">
  import type { TilesetMap } from './tilesets';

  let {
    name,
    map,
    image,
    size = 32,
    ariaHidden = true
  }: {
    name: string;
    map: TilesetMap;
    image: string;
    size?: number;
    ariaHidden?: boolean;
  } = $props();

  const x = $derived((map[name] ?? [0, 0])[0]);
  const y = $derived((map[name] ?? [0, 0])[1]);
  const scale = $derived(size / 64);
  const style = $derived(
    `--tile-x: ${x}px; --tile-y: ${y}px; --tile-image: url(${image}); --tile-size: ${size}px; --tile-scale: ${scale};`
  );
</script>

<span class="tile" style={style} aria-hidden={ariaHidden}></span>

<style>
  .tile {
    position: relative;
    display: inline-block;
    width: var(--tile-size, 32px);
    height: var(--tile-size, 32px);
    flex: 0 0 auto;
    vertical-align: middle;
  }

  .tile::before {
    position: absolute;
    top: 0;
    left: 0;
    transform: scale(var(--tile-scale, 0.5));
    transform-origin: 0 0;
    width: 64px;
    height: 64px;
    content: '';
    pointer-events: none;
    background-image: var(--tile-image);
    background-repeat: no-repeat;
    background-position: calc(-1 * var(--tile-x, 0px)) calc(-1 * var(--tile-y, 0px));
  }
</style>
