import { definePlugin, extractPlainText } from "emdash";
import type { PluginDescriptor } from "emdash";

const PLUGIN_ID = "portfolio-status-images";
const ADMIN_ENTRY = "@portfolio/emdash-status-images/admin";
const MEDIA_FILE_PATH = "/_emdash/api/media/file/";

type StatusImageEntry = {
	id: string;
	collection: "projects" | "posts";
	slug: string | null;
	status: string;
	title: string;
	summary: string;
	body: string;
	featuredImage?: string;
};

type PluginContentItem = {
	id: string;
	slug: string | null;
	status: string;
	data: Record<string, unknown>;
};

function getString(data: Record<string, unknown>, key: string): string {
	return typeof data[key] === "string" ? data[key] : "";
}

function getBodyText(data: Record<string, unknown>): string {
	const content = data.content;
	if (!content || (typeof content !== "string" && !Array.isArray(content))) {
		return "";
	}

	return extractPlainText(content as Parameters<typeof extractPlainText>[0]);
}

function getFeaturedImageReference(data: Record<string, unknown>): {
	id?: string;
	src?: string;
	storageKey?: string;
} {
	const image = data.featured_image;
	if (!image || typeof image !== "object") {
		return {};
	}

	const reference = image as Record<string, unknown>;
	const meta =
	        reference.meta && typeof reference.meta === "object"
	                ? (reference.meta as Record<string, unknown>)
	                : undefined;
	return {
		id: typeof reference.id === "string" ? reference.id : undefined,
		src: typeof reference.src === "string" ? reference.src : undefined,
		storageKey:
		        typeof meta?.storageKey === "string" ? meta.storageKey : undefined,
	};
}

function getPublicMediaUrl(storageKey: string): string {
        return `${MEDIA_FILE_PATH}${storageKey
                .split("/")
                .map((part) => encodeURIComponent(part))
                .join("/")}`;
}

async function toStatusImageEntry(
	entry: PluginContentItem,
	collection: StatusImageEntry["collection"],
	resolveMediaUrl: (id: string) => Promise<string | undefined>,
): Promise<StatusImageEntry> {
	const featuredImage = getFeaturedImageReference(entry.data);

	return {
		id: entry.id,
		collection,
		slug: entry.slug,
		status: entry.status,
		title: getString(entry.data, "title") || "Untitled",
		summary:
			getString(entry.data, collection === "projects" ? "summary" : "excerpt"),
		body: getBodyText(entry.data),
		featuredImage:
			(featuredImage.storageKey
			        ? getPublicMediaUrl(featuredImage.storageKey)
			        : undefined) ??
                        featuredImage.src ??
			(featuredImage.id ? await resolveMediaUrl(featuredImage.id) : undefined),
	};
}

export function statusImagesPlugin(): PluginDescriptor {
	return {
		id: PLUGIN_ID,
		version: "0.1.0",
		format: "native",
		entrypoint: "@portfolio/emdash-status-images",
		adminEntry: ADMIN_ENTRY,
		adminPages: [
			{
				path: "/status-images",
				label: "Status Images",
				icon: "image",
			},
		],
		options: {},
		capabilities: ["content:read", "media:read"],
	};
}

export function createPlugin() {
	return definePlugin({
		id: PLUGIN_ID,
		version: "0.1.0",
		capabilities: ["content:read", "media:read"],
		admin: {
			entry: ADMIN_ENTRY,
			pages: [
				{
					path: "/status-images",
					label: "Status Images",
					icon: "image",
				},
			],
		},
		routes: {
			entries: {
				handler: async (ctx) => {
					const content = ctx.content;
					if (!content) {
						throw new Error("Content access is unavailable.");
					}
					const media = ctx.media;

					const [projects, posts] = await Promise.all([
						content.list("projects", { limit: 100 }),
						content.list("posts", { limit: 100 }),
					]);

					const resolveMediaUrl = async (id: string) => {
						if (!media) {
							return undefined;
						}

						const item = await media.get(id);
						if (!item) {
						        return undefined;
						}

						const extension = item.filename.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
						return `${MEDIA_FILE_PATH}${encodeURIComponent(item.id)}${extension}`;
					};
					const entries = (
						await Promise.all([
							...projects.items.map((entry) =>
								toStatusImageEntry(entry, "projects", resolveMediaUrl),
							),
							...posts.items.map((entry) =>
								toStatusImageEntry(entry, "posts", resolveMediaUrl),
							),
						])
					).sort((left, right) => left.title.localeCompare(right.title));

					return { entries };
				},
			},
		},
	});
}

export default createPlugin;
