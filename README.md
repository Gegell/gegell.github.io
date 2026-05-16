# Gegell's Blog
Hi there, you've found the source for my personal blog.
It's built with SvelteKit and currently hosted on GitHub Pages under [gegell.github.io](https://gegell.github.io/).

The pages are built from markdown files in the `src/posts` directory with svelte's `static-adapter`
to allow them to be hosted here rather than setting up my own hosting.
The markdown itself is rendered with [mdsvex](https://mdsvex.com/) allowing for svelte components to be used in the markdown files.

## Development
To start a development server, run:
```bash
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building
To build the static files for deployment, run:

```bash
pnpm run build
```
They can be previewed with `pnpm run preview` before being deployed to GitHub Pages.
To actually deploy, run:

```bash
# TODO: actually make this work
pnpm run deploy
```

It will build the files and push them to the `gh-pages` branch which is actually what is hosted.

# Resources
A list of resources that I found useful while working on this project.
- [How to deploy a SvelteKit website to GitHub pages](https://www.okupter.com/blog/deploy-sveltekit-website-to-github-pages)
- [Joy of Code - Build A SvelteKit Markdown Blog](https://joyofcode.xyz/sveltekit-markdown-blog)
- [Svelte-Remixicon](https://github.com/aantusahaa/svelte-remixicon) -- A Svelte component library for Remixicon.
- [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte) -- The scaffold that was used to create this blog.