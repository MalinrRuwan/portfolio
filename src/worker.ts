import emdashWorker, { PluginBridge } from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

const OG_IMAGE_PATH = "/_og/image";
const MEDIA_API_PATH = "/_emdash/api/media/file/";
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

type ImagesBinding = {
	input: (stream: ReadableStream) => {
		transform: (options: Record<string, unknown>) => {
			output: (options: Record<string, unknown>) => Promise<{
				response: () => Response;
			}>;
		};
	};
};

type Env = {
	IMAGES: ImagesBinding;
};

async function serveOgImage(
	request: Request,
	env: Env,
	ctx: ExecutionContext,
): Promise<Response> {
	const url = new URL(request.url);
	const source = url.searchParams.get("source");

	if (request.method !== "GET" || !source?.startsWith(MEDIA_API_PATH)) {
		return new Response("Not found", { status: 404 });
	}

	const originalUrl = new URL(source, url.origin);
	if (!originalUrl.pathname.startsWith(MEDIA_API_PATH)) {
		return new Response("Not found", { status: 404 });
	}

	const original = await emdashWorker.fetch(
		new Request(originalUrl, request),
		env,
		ctx,
	);

	if (!original.ok || !original.body) {
		return original;
	}

	const transformed = await env.IMAGES
		.input(original.body)
		.transform({
			width: OG_WIDTH,
			height: OG_HEIGHT,
			fit: "cover",
			gravity: "auto",
			metadata: "none",
		})
		.output({ format: "image/jpeg" });

	const response = transformed.response();
	const headers = new Headers(response.headers);
	headers.set("Cache-Control", "public, max-age=31536000, immutable");

	const cachedResponse = new Response(response.body, {
		status: response.status,
		headers,
	});
	ctx.waitUntil(caches.default.put(request, cachedResponse.clone()));

	return cachedResponse;
}

export default {
	...emdashWorker,
	async fetch(request, env: Env, ctx) {
		const url = new URL(request.url);

		if (url.pathname === OG_IMAGE_PATH) {
			const cached = await caches.default.match(request);
			if (cached) {
				return cached;
			}

			return serveOgImage(request, env, ctx);
		}

		return emdashWorker.fetch(request, env, ctx);
	},
};
