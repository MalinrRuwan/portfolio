const MEDIA_API_PATH = "/_emdash/api/media/file/";
const OG_IMAGE_PATH = "/_og/image";

/**
 * Routes SEO images stored by EmDash through the Cloudflare Images crop endpoint.
 * External URLs remain untouched because the endpoint deliberately accepts only
 * this site's media API paths.
 */
export function getOgImageUrl(
	imageUrl: string | null | undefined,
	siteOrigin: string,
): string | undefined {
	if (!imageUrl) {
		return undefined;
	}

	const source = new URL(imageUrl, siteOrigin);
	if (
		source.origin !== siteOrigin ||
		!source.pathname.startsWith(MEDIA_API_PATH)
	) {
		return source.href;
	}

	const ogImage = new URL(OG_IMAGE_PATH, siteOrigin);
	ogImage.searchParams.set("source", `${source.pathname}${source.search}`);

	return ogImage.href;
}
