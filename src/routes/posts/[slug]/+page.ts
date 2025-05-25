import type { Post } from '$lib/types.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	try {
		const slug = params.slug;
		const post = await import(`../../../posts/${slug}.md`);
		const metadata = post.metadata as Omit<Post, 'content' | 'slug'>;

		return {
			content: post.default,
			slug: slug,
			...metadata
		} satisfies Post;
	} catch (err) {
		return error(404, `Could not find post ${params.slug}`);
	}
}

export const prerender = true;
