import type { Toc } from "@stefanprobst/rehype-extract-toc";

export type PostSummary = {
	title: string;
	slug: string;
	date: string;
	categories: string[];
	description: string;
	image?: string;
};

export type Post = PostSummary & {
	content: string;
	published: boolean;
	toc?: Toc;
    showToc: boolean;
};
