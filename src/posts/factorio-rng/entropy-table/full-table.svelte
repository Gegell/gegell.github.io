<script lang="ts">
	import rawRecipes from './scrap-recycling-recipes-2.0.55.json';
	import EntropyTable from './table.svelte';
	import type { Recipe } from './types';

	const recipes = rawRecipes as unknown as Recipe[];
</script>

<EntropyTable {recipes} />
