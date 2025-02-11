<script lang="ts">
  import * as config from '$lib/config';

  export let startYear = 2024;
  let year = new Date().getFullYear();
</script>

<footer>
  <p>{config.title} &copy; {startYear}{year > startYear ? ` - ${year}` : ''}</p>
</footer>

<style>
  footer {
    padding-block: var(--size-4);
    border-top: 1px solid var(--border)
  }

  p {
    color: var(--text-2);
    font-size: var(--size-3);
  }
</style>