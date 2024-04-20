import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

import { mdsvex, escapeSvelte } from 'mdsvex';
import remarkMath from 'remark-math'
import rehypeKatexSvelte from 'rehype-katex-svelte'
import { getHighlighter } from 'shiki'

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extension: '.md',
	remarkPlugins: [remarkMath],
	rehypePlugins: [rehypeKatexSvelte],
	highlight: {
		highlighter: async (code, lang = 'text') => {
			const highlighter = await getHighlighter({
				themes: ['ayu-dark', 'min-light'],
				langs: ['python']
			});
			const html = escapeSvelte(highlighter.codeToHtml(code, {
				lang: lang,
				themes: {
					dark: 'ayu-dark',
					light: 'min-light'
				},
				defaultColor: false
			}))
			return `{@html \`${html}\`}`
		}
	}
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
