<script lang="ts">
	import Katex from 'katex';

	let { latex = '', displayMode = false } = $props<{ latex?: string; displayMode?: boolean }>();
</script>

{#if displayMode}
	<div class="math math-display">
		<span class="katex-display">
			{@html Katex.renderToString(latex, { displayMode })}
		</span>
	</div>
{:else}
	<span class="math math-inline">
		{@html Katex.renderToString(latex, { displayMode })}
	</span>
{/if}
