import { json } from '@sveltejs/kit';
import type { Post, PostSummary } from '$lib/types';

async function getPosts() {
	let posts: PostSummary[] = [];

	const paths = import.meta.glob('/src/posts/*.md', { eager: true });
	for (const path in paths) {
		const file = paths[path];
		const slug = path.split('/').at(-1)?.replace('.md', '');

		if (file && typeof file === 'object' && 'metadata' in file && slug) {
			// Note that we use destructuring here to skip some other properties
			const full_meta = file.metadata as Omit<Post, 'content' | 'slug'>;
			if (!full_meta.published) continue; // Skip unpublished posts

			const { title, date, description, categories } = full_meta as Omit<PostSummary, 'slug'>;
			const post = { title, date, description, categories, slug } satisfies PostSummary;
			posts.push(post);
		}
	}
	posts = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return posts;
}

export const prerender = true;

export async function GET() {
	const posts = await getPosts();
	return json(posts);
}
