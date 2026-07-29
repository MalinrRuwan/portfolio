import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";

export interface CalloutPluginOptions {
  enabled?: boolean;
}

/**
 * Build-time descriptor used by `astro.config.mjs`.
 *
 * `componentsEntry` lets EmDash merge the plugin's Astro renderer into each
 * `<PortableText>` component rendered by the site.
 */
export function calloutPlugin(
  options: CalloutPluginOptions = {},
): PluginDescriptor<CalloutPluginOptions> {
  return {
    id: "portfolio-callout",
    version: "0.1.0",
    format: "native",
    entrypoint: "@portfolio/emdash-callout",
    componentsEntry: "@portfolio/emdash-callout/astro",
    options,
  };
}

/**
 * Request-time native plugin implementation.
 *
 * The block is exposed in the Portable Text editor's slash-command menu as
 * `/callout`; its field values are serialized as Portable Text node data.
 */
export function createPlugin(options: CalloutPluginOptions = {}) {
  return definePlugin({
    id: "portfolio-callout",
    version: "0.1.0",
    admin: {
      portableTextBlocks:
        options.enabled === false
          ? []
          : [
            {
              type: "callout",
              label: "Callout",
              icon: "link",
              description: "Highlight an important note or takeaway.",
              fields: [
                {
                  type: "text_input",
                  action_id: "title",
                  label: "Title",
                  placeholder: "Key takeaway",
                },
                {
                  type: "text_input",
                  action_id: "body",
                  label: "Body",
                  placeholder: "Add the supporting detail…",
                },
              ],
            },
          ],
    },
  });
}

export default createPlugin;
