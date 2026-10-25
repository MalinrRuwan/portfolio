import { bindings, defineConfig, triggers } from "cf/config";

export default defineConfig({
	worker: {
		name: "portfolio",
		compatibilityDate: "2026-04-08",
		compatibilityFlags: [
			"nodejs_compat",
		],
		entrypoint: "./src/worker.ts",
		cache: {
			enabled: true,
			crossVersionCache: false,
		},
		triggers: [
			triggers.scheduled({
				schedule: "*/15 * * * *",
			}),
		],
		env: {
			DB: bindings.d1({
				name: "portfolio-db",
			}),
			CACHE: bindings.kv({
				id: "060f94f5750044349e2d179c94b76c2d",
			}),
			MEDIA: bindings.r2({
				name: "portfolio-bucket",
			}),
			IMAGES: bindings.images({}),
		},
	},
});
