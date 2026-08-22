const postAssets = import.meta.glob(
	'/src/posts/**/*.{png,jpg,jpeg,gif,svg,webp,mp4,webm}',
	{
		eager: true,
		query: '?url',
		import: 'default'
	}
) as Record<string, string>;

export function resolvePostAsset(slug: string, asset: string | undefined): string | undefined {
	if (!asset) return undefined;

	if (/^(?:[a-z]+:)?\/\//i.test(asset) || asset.startsWith('/')) {
		return asset;
	}

	let relativePath = asset;
	if (relativePath.startsWith(`./${slug}/`)) {
		relativePath = relativePath.slice(`./${slug}/`.length);
	} else if (relativePath.startsWith('./')) {
		relativePath = relativePath.slice(2);
	}

	return postAssets[`/src/posts/${slug}/${relativePath}`] ?? asset;
}
