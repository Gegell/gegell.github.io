<script lang="ts">
	import Katex from 'katex';

	let { latex = '', displayMode = false } = $props<{ latex?: string; displayMode?: boolean }>();

	let katexString = $derived(Katex.renderToString(latex, { displayMode, throwOnError: false }));
</script>

{#if displayMode}
	<div class="math math-display">
		<span class="katex-display">
			{@html katexString}
		</span>
	</div>
{:else}
	<span class="math math-inline">
		{@html katexString}
	</span>
{/if}
