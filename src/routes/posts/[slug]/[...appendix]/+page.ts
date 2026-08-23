import type { Component } from 'svelte';
import type { Post } from '$lib/types.js';
import { error } from '@sveltejs/kit';
import { resolvePostAsset } from '$lib/post-assets';

type PostMetadata = Omit<Post, 'content' | 'slug'>;
type MarkdownModule = {
	default: Component;
	metadata: Partial<PostMetadata>;
};
type FilePath = string;

const postPaths = import.meta.glob('/src/posts/**/*.md') as Record<
	FilePath,
	() => Promise<MarkdownModule>
>;

export async function load({ params }) {
	const appendix = params.appendix?.split('/').filter(Boolean).join('/');
	const file = [params.slug, appendix].filter(Boolean).join('/');
	const postLoader = postPaths[`/src/posts/${file}.md`];

	if (!postLoader) {
		return error(404, `Could not find post ${file}`);
	}
	const post = await postLoader();
	let parent = post;
	if (appendix) {
		const parentLoader = postPaths[`/src/posts/${params.slug}.md`];
		parent = await parentLoader();
	}
	// FIXME: the parent resolution not being /slug/index.md but instead /slug.md causes issues with md path resolving.
	//        The paths in the markdown files now need to be ./appendix as otherwise they get translated to slug/slug/appendix... needs to be fixed.

	if (!parent || (appendix && !parent.metadata.published)) {
		return error(404, `Could not find parent post ${params.slug}`);
	}

	const parentMetadata = parent.metadata as PostMetadata;
	const metadata = (
		appendix ? { ...parentMetadata, ...post.metadata } : parentMetadata
	) as PostMetadata;

	return {
		...metadata,
		content: post.default,
		slug: file,
		image: resolvePostAsset(params.slug, metadata.image)
	} satisfies Post;
}

export const prerender = true;
