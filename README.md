# Malin Dhamsara — Portfolio

Personal portfolio and blog built with Astro, EmDash, Tailwind CSS v4, and the Cloudflare `cf` CLI.

## Layout

```text
.
├── apps/portfolio        Astro site, EmDash, and cloudflare.config.ts
├── plugins/              Local EmDash plugins (Bun workspace packages)
├── patches/              Bun patches for emdash + @emdash-cms/admin
├── package.json          Workspace shell and root scripts
├── bun.lock
└── tsconfig.json         Shared TypeScript base for plugins
```

## Development

```bash
bun install
bun run dev
```

- App: http://localhost:4321
- Admin: http://localhost:4321/_emdash/admin

## Build and deploy

```bash
bun run build          # cf build → apps/portfolio/.cloudflare/output/v0
bun run deploy         # cf deploy
```

`cf` is the only deploy tool. Configure authentication with `cf auth login` or `CLOUDFLARE_API_TOKEN`; the project config lives in `apps/portfolio/cloudflare.config.ts`.
