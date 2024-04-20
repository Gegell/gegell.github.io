import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

import { mdsvex } from 'mdsvex';
import remarkMath from 'remark-math'
import rehypeKatexSvelte from 'rehype-katex-svelte'

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extension: '.md',
	remarkPlugins: [remarkMath],
	rehypePlugins: [rehypeKatexSvelte],
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	extensions: ['.svelte', '.md'],
	preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: null
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/gegell-blog' : '',
		}
	}
};

export default config;
