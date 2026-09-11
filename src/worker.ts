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

type ExecutionContextLike = {
  waitUntil: (promise: Promise<unknown>) => void;
};

// EmDash's public media-delivery endpoint (raw file bytes). Everything else
// under /_emdash is authenticated admin/API traffic.
const MEDIA_FILE_PREFIX = MEDIA_API_PATH;

// With Workers Cache (wrangler "cache": { "enabled": true }) enabled,
// responses without Cache-Control are heuristically cached for statuses like
// 200. EmDash admin/API routes don't all set no-store, so pin them explicitly
// to keep authenticated traffic out of the edge cache. Hashed static assets
// (/_astro/*) are excluded so the admin SPA's own files stay cacheable.
const isBypassCache = (pathname: string) =>
  pathname.startsWith("/_emdash/") &&
  !pathname.startsWith(MEDIA_FILE_PREFIX) &&
  !pathname.includes("/_astro/");

const edgeCache = (caches as CacheStorage & { default: Cache }).default;

/**
 * Media files are immutable (content-addressed storage keys) and are the only
 * anonymous bytes under /_emdash. Cache them explicitly at the edge: EmDash
 * attaches a D1 session bookmark via Set-Cookie, which makes the response look
 * private and the edge skip it (cf-cache-status: BYPASS). The bookmark only
 * matters for authenticated admin reads, so it is safe to drop here.
 */
async function serveMediaFile(
  request: Request,
  env: Env,
  ctx: ExecutionContextLike,
): Promise<Response> {
  if (request.method === "GET") {
    const cached = await edgeCache.match(request);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set("X-EmDash-Media-Cache", "HIT");
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
  }

  const response = await emdashWorker.fetch(request, env, ctx);
  if (request.method !== "GET" || !response.ok || !response.body) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  const cacheable = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  ctx.waitUntil(edgeCache.put(request, cacheable.clone()));

  const marked = new Headers(headers);
  marked.set("X-EmDash-Media-Cache", "MISS");
  return new Response(cacheable.body, {
    status: cacheable.status,
    statusText: cacheable.statusText,
    headers: marked,
  });
}

async function serveOgImage(
  request: Request,
  env: Env,
  ctx: ExecutionContextLike,
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

  const transformed = await env.IMAGES.input(original.body)
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
  ctx.waitUntil(edgeCache.put(request, cachedResponse.clone()));

  return cachedResponse;
}

export default {
  ...emdashWorker,
  async fetch(request: Request, env: Env, ctx: ExecutionContextLike) {
    const url = new URL(request.url);

    if (url.pathname === OG_IMAGE_PATH) {
      const cached = await edgeCache.match(request);
      if (cached) {
        return cached;
      }

      return serveOgImage(request, env, ctx);
    }

    if (url.pathname.startsWith(MEDIA_FILE_PREFIX)) {
      return serveMediaFile(request, env, ctx);
    }

    const response = await emdashWorker.fetch(request, env, ctx);
    if (isBypassCache(url.pathname)) {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "private, no-store");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};
