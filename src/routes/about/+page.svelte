<script lang="ts">
	import RiBlueskyFill from 'svelte-remixicon/RiBlueskyFill.svelte';
	import RiGithubFill from 'svelte-remixicon/RiGithubFill.svelte';
	import RiMailSendFill from 'svelte-remixicon/RiMailSendFill.svelte';

  // Use atob to decode email address from base64 
  // -> Don't store email addresses in plain text to avoid crawlers
	const mail = atob('YWxleC5oZWxsZXIwMUBnbXguZGU=');

	const links = [
		{ name: 'Gegell', url: 'https://www.github.com/gegell', icon: RiGithubFill },
		// { name: mail, url: `mailto:${mail}`, icon: RiMailSendFill },
		{ name: '@gegellibu.bsky.social', url: 'https://bsky.app/profile/gegellibu.bsky.social', icon: RiBlueskyFill}
	];
</script>

<h1>About</h1>
This is the about page. It's a placeholder for now.

<h2>Contact</h2>
You can find me (for now) on:
<ul>
	{#each links as { name, url, icon }}
		{@const SvelteComponent = icon}
		<li>
			<a href={url}>
				<span class="remixicon"><SvelteComponent size="1.1em" /></span>
				{@html name}
			</a>
		</li>
	{/each}
</ul>

<style>
	h1 {
		margin-block: 0;
	}

	h2 {
		margin-block: var(--size-7) 0;
	}

	li {
		margin-block: var(--size-2);
	}

	.remixicon {
		display: inline-block;
		vertical-align: middle;
	}
</style>
