import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { d1, r2, cloudflareImages, kvCache } from "@emdash-cms/cloudflare";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";
import { calloutPlugin } from "@portfolio/emdash-callout";
import { statusImagesPlugin } from "@portfolio/emdash-status-images";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(projectRoot, "../..");
const emdashEntry = fileURLToPath(import.meta.resolve("emdash"));
const emdashAdminDirectory = realpathSync(
  resolve(dirname(emdashEntry), "../../@emdash-cms/admin"),
);

export default defineConfig({
  output: "server",
  adapter: cloudflare(
    {
      imageService: {
        build: 'compile',
        runtime: 'cloudflare-binding'
      }
    }
  ),
  cache: {
    provider: cacheCloudflare(),
  },
  // Aggressive edge caching: public content pages are served from Cloudflare's
  // Workers Cache for 24h (stale-while-revalidate for 7 days). EmDash tags
  // each response (blogs/projects + path) via Astro.cache.set(), so content
  // edits purge exactly the affected pages — long TTLs stay safe.
  routeRules: {
    "/": { maxAge: 86400, swr: 604800 },
    "/blog/[...path]": { maxAge: 86400, swr: 604800 },
    "/projects/[...path]": { maxAge: 86400, swr: 604800 },
    "/contact": { maxAge: 86400, swr: 604800 },
    "/v2": { maxAge: 86400, swr: 604800 },
    "/rss.xml": { maxAge: 600, swr: 3600 },
  },
  image: {
    layout: "constrained",
    responsiveStyles: true,
    // EmDash media URLs are absolute (https://<host>/_emdash/api/media/...).
    // Astro only hands absolute URLs to the image service when their host is
    // authorized here; otherwise it passes the original URL through and the
    // Cloudflare IMAGES binding never runs. Keep the production hosts plus
    // localhost for `cf dev`.
    domains: [
      "malindhamsara.dev",
      "portfolio.maliniqrub.workers.dev",
      "localhost",
      "127.0.0.1",
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      fs: {
        allow: [workspaceRoot, emdashAdminDirectory],
      },
    },
  },
  integrations: [
    react(),
    emdash({
      database: d1({ binding: "DB", session: "auto" }),
      storage: r2({ binding: "MEDIA" }),
      // DMG installers are larger than EmDash's 50 MB default; 100 MB is
      // Cloudflare Workers' request-body ceiling.
      maxUploadSize: 100 * 1024 * 1024,
      objectCache: kvCache({ binding: "CACHE" }),
      mediaProviders: [
        cloudflareImages({
          accountId: import.meta.env.CF_ACCOUNT_ID,
          accountHash: import.meta.env.CF_IMAGES_ACCOUNT_HASH,
          apiToken: import.meta.env.CF_IMAGES_TOKEN,
        }),
      ],
      plugins: [calloutPlugin(), statusImagesPlugin()],
    }),
  ],
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-inter",
      weights: [400, 500, 600, 700],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Crimson Text",
      cssVariable: "--font-crimson",
      weights: [400],
      styles: ["italic"],
      fallbacks: ["Georgia", "serif"],
    },
  ],
  devToolbar: { enabled: false },
});
