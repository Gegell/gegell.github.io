<script lang="ts">
	import RiSunFill from 'svelte-remixicon/RiSunFill.svelte';
	import RiMoonClearFill from 'svelte-remixicon/RiMoonClearFill.svelte';
	import { theme, toggleTheme } from '$lib/theme';
</script>

<button
	onclick={toggleTheme}
	role="switch"
	aria-checked={$theme === 'dark'}
	aria-label="Toggle theme"
>
	<div>
		{#if $theme === 'dark'}
			<RiMoonClearFill />
		{:else}
			<RiSunFill />
		{/if}
	</div>
</button>

<style>
	button {
		background: var(--surface-4);
		border: none;
		cursor: pointer;
		box-shadow: none;
		width: var(--size-8);
		border-radius: 2em;
		position: relative;
		height: var(--size-5);
	}

	button[aria-checked='true'] div {
		transform: translateX(1em);
	}

	button div {
		display: inline-block;
		font-size: var(--size-3);
		color: var(--text-2);
		font-weight: 300;
		left: var(--size-2);
		position: absolute;
		transform: rotate(-90deg);
		transition: transform 0.4s var(--ease-elastic-in-out-2);
	}
</style>
