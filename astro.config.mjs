import cloudflare from "@astrojs/cloudflare";
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

const emdashEntry = fileURLToPath(import.meta.resolve("emdash"));
const emdashAdminDirectory = realpathSync(
  resolve(dirname(emdashEntry), "../../@emdash-cms/admin"),
);

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  image: {
    layout: "constrained",
    responsiveStyles: true,
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      fs: {
        allow: [process.cwd(), emdashAdminDirectory],
      },
    },
  },
  integrations: [
    react(),
    emdash({
      database: d1({ binding: "DB", session: "auto" }),
      storage: r2({ binding: "MEDIA" }),
      objectCache: kvCache({ binding: "CACHE" }),
      mediaProviders: [
        cloudflareImages({
          accountId: import.meta.env.CF_ACCOUNT_ID,
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
