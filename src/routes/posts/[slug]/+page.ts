import { error } from '@sveltejs/kit';

export async function load({ params }) {
	try {
		const slug = params.slug;
		const post = await import(`../../../posts/${slug}.md`);

		return {
			content: post.default,
			meta: post.metadata
		};
	} catch (err) {
		return error(404, `Could not find post ${params.slug}`);
	}
}

export const prerender = true;