<script lang="ts">
  const { src, width = 96, height = 32 } = $props();
</script>

<svg viewBox="0 0 {6*width} {6*height}" width="100%">
  <defs>
    <pattern
      id="pmatrix"
      width="6"
      height="6"
      x="0.5"
      y="0.5"
      patternUnits="userSpaceOnUse"
    >
      <rect width="5" height="5" rx="1" ry="1" fill="var(--surface-4, #222)" />
    </pattern>
    <pattern
      id="pmatrix_active"
      width="6"
      height="6"
      x="0.5"
      y="0.5"
      patternUnits="userSpaceOnUse"
    >
      <rect width="5" height="5" rx="1" ry="1" fill="var(--brand, #f80)" />
    </pattern>
  </defs>
  <mask id="active_mask">
    <image href={src} width="{6*width}" height="{6*height}" />
  </mask>
  <mask id="inactive_mask">
    <image href={src} width="{6*width}" height="{6*height}" style="filter: invert(100%);" />
  </mask>
  <rect width="{6*width}" height="{6*height}" fill="url(#pmatrix)" mask="url(#inactive_mask)" />
  <rect width="{6*width}" height="{6*height}" fill="url(#pmatrix_active)" mask="url(#active_mask)" />
</svg>

<style>
  image {
    image-rendering: crisp-edges;
  }
</style>