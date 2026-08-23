import type { Toc } from "@stefanprobst/rehype-extract-toc";
import type { Component } from 'svelte';

export type PostSummary = {
	title: string;
	slug: string;
	date: string;
	categories: string[];
	description: string;
	image?: string;
};

export type Post = PostSummary & {
	content: Component;
	published: boolean;
	toc?: Toc;
    showToc: boolean;
};
