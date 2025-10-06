import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

import { mdsvex, escapeSvelte } from 'mdsvex';
import remarkMath from 'remark-math'
import rehypeKatexSvelte from 'rehype-katex-svelte'
import rehypeCallouts from 'rehype-callouts';
import { createHighlighter } from 'shiki'
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeToc from '@stefanprobst/rehype-extract-toc';
import rehypeTocExport from './src/lib/rehype-toc-export.js';
import relativeImages from 'mdsvex-relative-images';

const highlighter = await createHighlighter({
	themes: ['ayu-dark', 'min-light'],
	langs: ['python', 'cpp']
});

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extension: '.md',
	remarkPlugins: [
		remarkMath,
		relativeImages
	],
	rehypePlugins: [
		rehypeCallouts,
		rehypeKatexSvelte,
		rehypeSlug,
		rehypeAutolinkHeadings,
		rehypeToc,
		rehypeTocExport
	],
	highlight: {
		highlighter: async (code, lang = 'text') => {
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
			base: process.argv.includes('dev') ? '' : process.env.BASE_PATH
		},
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore 404s
				if (message.includes('404')) {
					return;
				}

				// Log other errors
				console.error('Failed to prerender', { path, referrer, message });
			},
		}
	}
};

export default config;
