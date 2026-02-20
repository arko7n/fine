import { TOOL_DEFINITIONS } from "./tool-manifest.js";

type PluginConfig = {
  backendUrl: string;
};

const plugin = {
  id: "pipedream-connect",
  name: "Pipedream Connect",
  description: "Dynamic integration tools that discover and execute Pipedream-connected app actions",

  register(api: {
    pluginConfig: PluginConfig | undefined;
    registerTool: (tool: unknown) => void;
  }) {
    if (!api.pluginConfig) return;

    if (!api.pluginConfig.backendUrl) {
      throw new Error("pipedream-connect plugin requires backendUrl in config");
    }
    const backendUrl = api.pluginConfig.backendUrl;

    for (const def of TOOL_DEFINITIONS) {
      api.registerTool({
        name: def.name,
        label: def.label,
        description: def.description,
        parameters: def.parameters,

        async execute(_toolCallId: string, params: Record<string, unknown>, ctx?: { user?: string }) {
          const res = await fetch(`${backendUrl}/api/internal/tools/invoke`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ app: def.app, action: def.action, params, userId: ctx?.user }),
          });

          const data = await res.json();
          if (!res.ok) {
            return {
              content: [
                { type: "text" as const, text: `Error: ${data.error ?? "Tool execution failed"}` },
              ],
            };
          }

          return {
            content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
          };
        },
      });
    }
  },
};

export default plugin;
