import type { Post } from '$lib/types';

export async function load({ fetch }) {
	const res = await fetch('/api/posts');
	const posts: Post[] = await res.json();
	return { posts };
}
