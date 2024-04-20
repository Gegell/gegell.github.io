<script lang="ts">
  import * as config from '$lib/config';
</script>

<footer>
  <p>{config.title} &copy; 2024 - {new Date().getFullYear()}</p>
</footer>

<style>
  footer {
    padding-block: var(--size-4);
    border-top: 1px solid var(--border)
  }

  p {
    color: var(--text-2);
  }
</style>