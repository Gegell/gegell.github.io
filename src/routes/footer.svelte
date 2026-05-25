<script lang="ts">
  import * as config from '$lib/config';

  interface Props {
    startYear?: number;
  }

  let { startYear = 2024 }: Props = $props();
  let year = new Date().getFullYear();
</script>

<footer>
  <div>{config.title} &copy; {startYear}{year > startYear ? ` - ${year}` : ''}</div>
</footer>

<style>
  footer {
    padding-inline: var(--size-7);
  }
  
  div {
    border-top: 1px solid var(--border);
    padding-block: var(--size-4);
    color: var(--text-2);
    font-size: var(--size-3);
  }
</style>