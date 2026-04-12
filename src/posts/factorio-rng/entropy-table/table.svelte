<script lang="ts">
  import rawRecipes from './scrap-recycling-recipes-2.0.55.json';
  import { TilesetIcon, recipeTileset, recipeTilesetMap } from '../tileset-image';
  import { attachTooltip } from './attachTooltip';

  type Output = {
    name: string;
    amount: number;
    probability?: number;
  };
  type Recipe = {
    key: string;
    entropy: number;
    crafting_speed: number;
    outputs: Output[];
  };
  const recipes = rawRecipes as unknown as Recipe[];

  function formatProbability(probability: number): number {
    return Math.round(probability * 1000) / 10;
  }

  function formatName(name: string): string {
    return name
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join(' ');
  }
</script>

{#snippet singleItem(name: string)}
  <button type="button" class="item" aria-label={formatName(name)} use:attachTooltip={formatName(name)}>
    <TilesetIcon {name} map={recipeTilesetMap} image={recipeTileset} size={32} />
  </button>
{/snippet}


{#snippet singleOutput(o: Output) }
  <div class="output">
    <span class="amount">{o.amount}x</span>
    <span class="name">{formatName(o.name)}</span>
    {#if o.probability !== undefined}
      <span class="probability">({formatProbability(o.probability)}%)</span>
    {/if}
  </div>
{/snippet}

<table>
  <thead>
    <tr>
      <th>Recipe</th>
      <th>Bits per Craft</th>
      <th>Crafting Time</th>
      <th>Items Returned</th>
    </tr>
  </thead>
  <tbody>
    {#each recipes as recipe}
      <tr>
        <td>{@render singleItem(recipe.key)}</td>
        <td>{recipe.entropy}</td>
        <td>{recipe.crafting_speed}</td>
        <td>
          {#each recipe.outputs as output}
            {@render singleOutput(output)}
          {/each}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .item {
    position: relative;
    display: inline-block;
    vertical-align: middle;
    padding: var(--size-1);
    border: 0;
    box-shadow: none;
    background: transparent;
    font: inherit;
    color: inherit;
    cursor: pointer;
    outline: none;
  }
</style>