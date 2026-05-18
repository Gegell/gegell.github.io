<script lang="ts">
	import RiBlueskyFill from 'svelte-remixicon/RiBlueskyFill.svelte';
	import RiGithubFill from 'svelte-remixicon/RiGithubFill.svelte';
	import RiMailSendFill from 'svelte-remixicon/RiMailSendFill.svelte';
	import RiRedditFill from 'svelte-remixicon/RiRedditFill.svelte';
	import RiTwitterFill from 'svelte-remixicon/RiTwitterFill.svelte';

	// Use atob to decode email address from base64
	// -> Don't store email addresses in plain text to avoid crawlers
	const mail = atob('YWxleC5oZWxsZXIwMUBnbXguZGU=');

	const links = [
		{ name: 'Gegell', url: 'https://www.github.com/gegell', icon: RiGithubFill },
		{ name: mail, url: `mailto:${mail}`, icon: RiMailSendFill, hidden: true },
		{
			name: '@gegellibu.bsky.social',
			url: 'https://bsky.app/profile/gegellibu.bsky.social',
			icon: RiBlueskyFill
		},
		{
			name: '@Gegellibu',
			url: 'https://www.twitter.com/gegellibu',
			icon: RiTwitterFill,
			inactive: true,
			hidden: true
		},
		{ name: 'Gegellibu', url: 'https://www.reddit.com/user/Gegellibu', icon: RiRedditFill },
		{ name: 'Shadertoy: Gegell', url: 'https://www.shadertoy.com/user/gegell' },
		{ name: 'compute.toys: Gegell', url: 'https://compute.toys/userid/f91bbd73-7734-49a9-99ce-460774d4ccc0' }
	];
</script>

<article class="prose">
	<h1>About</h1>
	<p>
		Hi I'm Gegell, a Computer Science grad student specializing in 3D computer vision.
		In my free time I like to dabble with computer graphics especially shaders for technical effects,
		but also low-level programming and reverse engineering to understand
		programs close to the metal.
	</p>

	<p>
		This blog started out as I wanted a place to showcase the things I make in a longer format,
		to share them with the world.
	</p>

	<h2>Contact</h2>
	You can find me here:
	<ul>
		{#each links as { name, url, icon, inactive = false, hidden = false }}
			{#if !hidden}
				<li>
					<a href={url} class:inactive>
						{#if icon}
							{@const SvelteComponent = icon}
							<span class="remixicon"><SvelteComponent size="1.1em" /></span>
						{/if}
						{@html name}
						{#if inactive}
							(inactive)
						{/if}
					</a>
				</li>
			{/if}
		{/each}
	</ul>
</article>

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

	a {
		color: var(--brand);
		text-decoration: none;
	}

	a.inactive {
		color: var(--text-2);
		font-style: italic;
	}
</style>
