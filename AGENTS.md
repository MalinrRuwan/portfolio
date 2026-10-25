# AGENTS.md — Malin Dhamsara Portfolio

Personal portfolio and blog built on the EmDash CMS (Astro), styled with Tailwind CSS v4, package-managed with Bun.

## Repository layout

This is a Bun workspace. The site lives in `apps/portfolio`; local EmDash plugins live in `plugins/*` and are linked with `workspace:*`.

```text
.
├── apps/portfolio        Astro site + EmDash + Cloudflare config
├── plugins/              Local EmDash plugins (workspace packages)
├── patches/              Bun patches applied to emdash + @emdash-cms/admin
├── package.json          Workspace shell (workspaces, overrides, patches, scripts)
├── bun.lock
└── tsconfig.json         Shared TypeScript base for workspace plugins
```

All commands below can be run from the repository root; root scripts delegate to `apps/portfolio` with `bun run --filter portfolio <script>`.

## Stack

- **Runtime / package manager:** Bun (latest). Use `bun` / `bunx` for everything.
- **CLI / deploy:** Cloudflare `cf` CLI (beta). The site builds and deploys with `cf`, not Wrangler.
- **CMS:** [EmDash](https://github.com/emdash-cms/emdash) v1.3+ — full-stack TypeScript CMS as an Astro integration. Admin panel at `/_emdash/admin`.
- **Framework:** Astro 7, SSR (`output: "server"`), `@astrojs/cloudflare` 15 beta (Cloudflare Workers with D1 + R2 + KV + Images bindings). The 15 beta adapter uses `@cloudflare/vite-plugin` 2 beta and writes the Build Output Specification consumed by `cf`.
- **Styling:** Tailwind CSS v4 (CSS-first config via `@theme` and `@utility` in `apps/portfolio/src/styles/global.css`).
- **Design direction:** quiet editorial minimal — warm paper background, near-black ink, hairline rules, one serif accent (Crimson Text italic), numbered section kickers.
- **Fonts:** Inter (body/UI), Crimson Text italic (accent) via Astro Fonts API.

## Commands

```bash
bun install            # install all workspace dependencies
bun run dev            # cf dev → Astro dev server (EmDash migrations, seed, admin)
bun run build          # cf build → .cloudflare/output/v0
bun run deploy         # cf deploy → build + upload to Cloudflare
bun run typecheck      # astro check
bun run types          # emdash types (regenerate DB-derived TypeScript types)
bun run migrate        # emdash migrate (deployment-managed EmDash migrations)
```

To run a command directly in the app:

```bash
cd apps/portfolio
bun run dev
bunx cf build
bunx cf deploy --dry-run   # validates build + bindings without uploading
```

## Key files

| File                                                     | Purpose                                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `apps/portfolio/astro.config.mjs`                        | Astro + EmDash integration, Cloudflare adapter, D1/R2/KV bindings, fonts         |
| `apps/portfolio/cloudflare.config.ts`                    | `cf` project config: worker entrypoint, compatibility, bindings, cron trigger    |
| `apps/portfolio/src/worker.ts`                           | Custom Worker entry (EmDash worker + OG image + media cache handling)           |
| `apps/portfolio/src/live.config.ts`                      | EmDash live-collection loader (boilerplate)                                      |
| `apps/portfolio/seed/seed.json`                          | Initial schema + sample content (collections, taxonomies, menus)                 |
| `apps/portfolio/src/data/profile.ts`                     | Structured resume/personal data (about, stack, volunteering, education, contact) |
| `apps/portfolio/src/styles/global.css`                   | Tailwind v4 tokens + `@utility` classes (kicker, display, u-link, reveal)        |
| `apps/portfolio/src/layouts/Base.astro`                  | Layout with responsive nav, footer, scroll-reveal script                         |
| `apps/portfolio/src/components/SiteLogo.astro`           | Inline SVG logo (header + favicon source); theme-aware fill/stroke               |
| `apps/portfolio/src/components/SectionHeader.astro`      | Numbered kicker + hairline                                                       |
| `apps/portfolio/src/components/PageHeader.astro`         | Editorial page header for subpages                                               |
| `apps/portfolio/src/components/PostRow.astro`            | Blog list row                                                                    |
| `apps/portfolio/src/components/ProjectCard.astro`        | Project card (used in index + detail)                                            |

## Content model

- **CMS-managed** (edit in `/_emdash/admin`): `projects`, `blogs`, site settings, primary menu, taxonomies.
- **Code-managed** (edit in `apps/portfolio/src/data/profile.ts`): structured resume data shown on the home page.

The `apps/portfolio/seed/seed.json` only populates an empty database. After setup, editors can change content freely; the site will reflect it immediately.

## EmDash rules for agents

- All CMS content pages are server-rendered (`output: "server"`). No `getStaticPaths()` for CMS routes.
- Image fields are objects (`{ src, alt }`). Use `<Image image={...} />` from `"emdash/ui"`.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID.
- Always call `Astro.cache.set(cacheHint)` after querying content.
- Taxonomy names in queries must match seed (`category`, `tag`), not pluralized forms.

## Design system

- **Colors:** `--color-bg` warm paper, `--color-ink` near-black, `--color-muted`, `--color-faint`, `--color-rule`. All use `light-dark()` for automatic dark mode.
- **Utilities:** `kicker` (tiny uppercase section label), `display` (large editorial type), `u-link` (animated underline), `reveal` (scroll-triggered fade-rise).
- **Section pattern:** `<SectionHeader index="01" label="About" />` creates a numbered kicker + hairline rule.
- **Type scale:** don't mirror the original Figma sizes literally — the redesign uses a deliberately large display + tiny kickers for contrast.

## Tooling notes for agents

- **`cf` only — no Wrangler.** Do not add `wrangler.jsonc`, `wrangler.config.ts`, a `wrangler` dependency, or `.wrangler` state. `cf` reads `apps/portfolio/cloudflare.config.ts` and Astro writes the Build Output Specification to `apps/portfolio/.cloudflare/output/v0`. Local state lives in `apps/portfolio/.cloudflare/state`.
- **Astro/Cloudflare versions are pinned deliberately.** `@astrojs/cloudflare` must stay on the 15 beta line: that is the adapter that uses `@cloudflare/vite-plugin` 2 beta and writes `cf`'s Build Output. The root `overrides["@astrojs/cloudflare"]` pin is required because `@emdash-cms/cloudflare` declares a stable peer (`>=12.0.0`) that would otherwise resolve a second, older adapter (and pull Wrangler back in).
- **`overrides.zod` in the root package.json is intentional**: EmDash's tool schemas are built with zod 4.5.x while `@modelcontextprotocol/sdk` resolves its own copy (4.4.x). Mixing them makes the MCP `tools/list` crash server-side (`Cannot read properties of undefined (reading 'push')`). The override pins every zod to 4.5.4 — don't remove it unless the SDK resolves a compatible version on its own.
- **Figma MCP** is configured in `.kimi-code/mcp.json` (local Dev Mode server at `http://127.0.0.1:3845/mcp`, requires Figma desktop app running). MCP servers connect at session start — restart the session after editing `mcp.json`.
- **agent-browser** is used for screenshots. The Node daemon in the installed version is broken in this environment, so always set `AGENT_BROWSER_NATIVE=1` before agent-browser commands.
- EmDash runs on Cloudflare (D1 database, R2 media, KV object cache, Images). `cf dev` emulates the bindings locally; no Cloudflare account is required for `bun run dev`.
- **Media/OG cache headers:** the Cloudflare adapter injects `Cloudflare-CDN-Cache-Control: no-store` on any response that does not set that header, which makes Workers Caching return `cf-cache-status: BYPASS`. `apps/portfolio/src/worker.ts` explicitly sets `Cloudflare-CDN-Cache-Control` (and `Cache-Control`) for `/_emdash/api/media/file/*`, `/_og/image`, and `/_image`. Keep both headers on any new immutable asset route.
- **Cloudflare Images is two different things here:** `imageService: { runtime: "cloudflare-binding" }` uses the `IMAGES` binding for on-demand transformations (`/_image?...`) and does **not** store anything in the Cloudflare Images dashboard. The `cloudflareImages()` media provider is only used when uploading media through the Images API; existing R2 media keeps `provider: "local"` and is never migrated automatically. Image transforms also require the public host in `image.domains` — otherwise Astro passes the original URL through unchanged. Provider uploads need `CF_ACCOUNT_ID`, `CF_IMAGES_ACCOUNT_HASH`, and `CF_IMAGES_TOKEN` in the Worker runtime environment.
- DMG uploads depend on the Bun patches in `patches/` (applied to `emdash` and `@emdash-cms/admin`). Patches must stay declared in the **root** `package.json`. After upgrading either package, regenerate them: `bun patch <pkg>` → edit `node_modules/<pkg>` → `bun patch --commit 'node_modules/<pkg>'`.
- `apps/portfolio/astro.config.mjs` allows Vite file access to the workspace root so plugin sources in `plugins/*` can be served in dev.

## Responsive navbar

`apps/portfolio/src/layouts/Base.astro` contains a robust, accessible header:

- Site logo is an inline SVG component (`apps/portfolio/src/components/SiteLogo.astro`) so it renders as vector rather than a rasterized `<img>`, with `shape-rendering="geometricPrecision"` and GPU-promotion for smooth edges on retina displays. Theme-aware fill/stroke replaces the old CSS `filter: invert()`.
- Skip-to-content link appears on focus for keyboard users.
- Sticky header that gains a solid background + hairline border after scrolling.
- Desktop (`sm:` and up): horizontal nav links pulled from the EmDash primary menu.
- Mobile (<640px): hamburger button opens a full-height overlay panel with large stacked links.
- Mobile menu behavior: Escape to close, click outside to close, close on link navigation, focus trap + focus management, and auto-close when resizing to desktop.
- Body scroll is locked while the mobile menu is open (`overscroll-behavior: none`).

## What not to do

- Don't add heavy gradients, shadows, or decorative backgrounds. The design is intentionally restrained.
- Don't hardcode the site title or nav — pull from EmDash settings/menu.
- Don't add new content collections without updating `seed/seed.json` or running the admin setup wizard.
- Don't use npm/pnpm/yarn — stick to Bun.
- Don't reintroduce Wrangler config or dependencies; the project is on the `cf` CLI.
