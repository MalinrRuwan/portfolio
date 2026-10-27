import emdashWorker, { PluginBridge } from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

const OG_IMAGE_PATH = "/_og/image";
const MEDIA_API_PATH = "/_emdash/api/media/file/";
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// `Cloudflare-CDN-Cache-Control` must be set explicitly on responses that
// bypass Astro's cache provider. The Cloudflare adapter otherwise injects
// `no-store` on every response without it, which makes Workers Caching report
// `cf-cache-status: BYPASS` even when `Cache-Control` is public.
const EDGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

// One year, including subdomains. Add `; preload` only after the domain has
// been submitted to and accepted by the HSTS preload list.
const HSTS_HEADER = "max-age=31536000; includeSubDomains";

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

// Workers Caching is enabled in cloudflare.config.ts. EmDash admin/API routes
// don't all set no-store, so pin them explicitly to keep authenticated traffic
// out of the edge cache. Hashed static assets (/_astro/*) are excluded so the
// admin SPA's own files stay cacheable.
const isBypassCache = (pathname: string) =>
  pathname.startsWith("/_emdash/") &&
  !pathname.startsWith(MEDIA_FILE_PREFIX) &&
  !pathname.includes("/_astro/");

/**
 * Mark an immutable response as cacheable at the edge.
 *
 * `Cloudflare-CDN-Cache-Control` must be set explicitly: the Cloudflare adapter
 * injects `no-store` on any response without it, which makes Workers Caching
 * report `cf-cache-status: BYPASS` even when `Cache-Control` is public.
 */
function cacheableResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  headers.set("Cache-Control", EDGE_CACHE_CONTROL);
  headers.set("Cloudflare-CDN-Cache-Control", EDGE_CACHE_CONTROL);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Apply HSTS to every HTTPS response, including errors and assets served by
 * the Worker. HTTP dev-server responses are left alone.
 */
function withHsts(response: Response, request: Request): Response {
  if (new URL(request.url).protocol !== "https:") return response;

  try {
    // Most responses have mutable headers; avoid cloning the body and
    // collapsing any Set-Cookie headers.
    response.headers.set("Strict-Transport-Security", HSTS_HEADER);
    return response;
  } catch {
    const headers = new Headers(response.headers);
    headers.set("Strict-Transport-Security", HSTS_HEADER);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}

/**
 * Media files are immutable (content-addressed storage keys) and are the only
 * anonymous bytes under /_emdash. EmDash attaches a D1 session bookmark via
 * Set-Cookie, which makes the response look private and the edge skip it
 * (cf-cache-status: BYPASS). The bookmark only matters for authenticated admin
 * reads, so drop it here. Workers Caching (enabled in cloudflare.config.ts)
 * handles storage; no manual Cache API layer is needed.
 */
async function serveMediaFile(
  request: Request,
  env: Env,
  ctx: ExecutionContextLike,
): Promise<Response> {
  const response = await emdashWorker.fetch(request, env, ctx);
  if (request.method !== "GET" || !response.ok || !response.body) {
    return response;
  }

  return cacheableResponse(response);
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

  return cacheableResponse(transformed.response());
}

async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContextLike,
): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === OG_IMAGE_PATH) {
    return serveOgImage(request, env, ctx);
  }

  if (url.pathname.startsWith(MEDIA_FILE_PREFIX)) {
    return serveMediaFile(request, env, ctx);
  }

  if (url.pathname === "/_image") {
    const response = await emdashWorker.fetch(request, env, ctx);
    return response.ok ? cacheableResponse(response) : response;
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
}

export default {
  ...emdashWorker,
  async fetch(request: Request, env: Env, ctx: ExecutionContextLike) {
    const response = await handleRequest(request, env, ctx);
    return withHsts(response, request);
  },
};
