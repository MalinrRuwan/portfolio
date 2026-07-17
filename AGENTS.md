# AGENTS.md — Malin Dhamsara Portfolio

Personal portfolio and blog built on the EmDash CMS (Astro), styled with Tailwind CSS v4, package-managed with Bun.

## Stack

- **Runtime / package manager:** Bun (latest). Use `bun` / `bunx` for everything.
- **CMS:** [EmDash](https://github.com/emdash-cms/emdash) v0.29+ — full-stack TypeScript CMS as an Astro integration. Admin panel at `/_emdash/admin`.
- **Framework:** Astro 7, SSR (`output: "server"`), `@astrojs/node` adapter.
- **Styling:** Tailwind CSS v4 (CSS-first config via `@theme` and `@utility` in `src/styles/global.css`).
- **Design direction:** quiet editorial minimal — warm paper background, near-black ink, hairline rules, one serif accent (Crimson Text italic), numbered section kickers.
- **Fonts:** Inter (body/UI), Crimson Text italic (accent) via Astro Fonts API.

## Commands

```bash
bun install            # install dependencies
bun run dev            # EmDash dev server (migrations + seed + Astro)
bun run build          # production build
bun run preview        # preview production build
bunx emdash types      # regenerate TypeScript types from live schema
bunx emdash dev        # same as bun run dev, but runs migrations automatically
```

## Key files

| File | Purpose |
| ---- | ------- |
| `astro.config.mjs` | Astro + EmDash integration, SQLite + local storage, fonts |
| `src/live.config.ts` | EmDash live-collection loader (boilerplate) |
| `seed/seed.json` | Initial schema + sample content (collections, taxonomies, menus) |
| `src/data/profile.ts` | Structured resume/personal data (about, stack, volunteering, education, contact) |
| `src/styles/global.css` | Tailwind v4 tokens + `@utility` classes (kicker, display, u-link, reveal) |
| `src/layouts/Base.astro` | Layout with responsive nav, footer, scroll-reveal script |
| `src/components/SiteLogo.astro` | Inline SVG logo (header + favicon source); theme-aware fill/stroke |
| `src/components/SectionHeader.astro` | Numbered kicker + hairline |
| `src/components/PageHeader.astro` | Editorial page header for subpages |
| `src/components/PostRow.astro` | Blog list row |
| `src/components/ProjectCard.astro` | Project card (used in index + detail) |

## Content model

- **CMS-managed** (edit in `/_emdash/admin`): `projects`, `posts`, site settings, primary menu, taxonomies.
- **Code-managed** (edit in `src/data/profile.ts`): structured resume data shown on the home page.

The `seed/seed.json` only populates an empty database. After setup, editors can change content freely; the site will reflect it immediately.

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

- **Figma MCP** is configured in `.kimi-code/mcp.json` (local Dev Mode server at `http://127.0.0.1:3845/mcp`, requires Figma desktop app running). MCP servers connect at session start — restart the session after editing `mcp.json`.
- **agent-browser** is used for screenshots. The Node daemon in the installed version is broken in this environment, so always set `AGENT_BROWSER_NATIVE=1` before agent-browser commands.
- EmDash runs locally on Node.js + SQLite; no Cloudflare account is required. Do not switch the Astro config to the Cloudflare adapter unless explicitly asked.

## Responsive navbar

`src/layouts/Base.astro` contains a robust, accessible header:
- Site logo is an inline SVG component (`src/components/SiteLogo.astro`) so it renders as vector rather than a rasterized `<img>`, with `shape-rendering="geometricPrecision"` and GPU-promotion for smooth edges on retina displays. Theme-aware fill/stroke replaces the old CSS `filter: invert()`.
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
