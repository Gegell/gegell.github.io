<script lang="ts">
	import Footer from './footer.svelte';
	import Header from './header.svelte';
	import PageTransition from './transition.svelte';

	import 'open-props/style';
	import 'open-props/normalize';
	import 'open-props/buttons';

	import '../app.css';

	let { data, children } = $props();
</script>

<div class="layout">
	<Header />
	<main>
		<PageTransition url={data.url}>
			{@render children?.()}
		</PageTransition>
	</main>
	<Footer />
</div>

<style>
	.layout {
		min-height: 100vh;
		max-inline-size: 1440px;
		display: grid;
		grid-template-rows: auto 1fr auto;
		margin-inline: auto;
	}

	main {
		padding-inline: var(--size-7);
	}
</style>
