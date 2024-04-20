<script lang="ts">
	import { fly } from 'svelte/transition';
	import { RiSunFill, RiMoonClearFill } from 'svelte-remixicon';
	import { theme, toggleTheme } from '$lib/theme';
</script>

<button on:click={toggleTheme} aria-label="Toggle theme">
	{#if $theme === 'dark'}
		<div in:fly={{ y: 10 }}>
			<RiSunFill />
			<span>Light</span>
		</div>
	{:else}
		<div in:fly={{ y: -10 }}>
			<RiMoonClearFill />
			<span>Dark</span>
		</div>
	{/if}
</button>

<style>
	button {
		display: flex;
		align-items: center;
		gap: var(--size-2);
		background: none;
		border: none;
		cursor: pointer;
		box-shadow: none;
	}

	button div {
		display: flex;
		align-items: center;
		gap: var(--size-1);
	}

	button span {
		font-size: var(--size-3);
		color: var(--text-2);
		font-weight: 300;
	}
</style>
