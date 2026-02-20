import { TOOL_DEFINITIONS } from "./tool-manifest.js";

type PluginConfig = {
  backendUrl: string;
};

const plugin = {
  id: "fine-tools",
  name: "Fine Tools",
  description: "Thin proxy tools that delegate execution to the Fine backend",

  register(api: {
    pluginConfig: PluginConfig | undefined;
    registerTool: (tool: unknown) => void;
  }) {
    // OC calls register() without pluginConfig during `plugins install` discovery.
    // Skip tool registration in that case — tools only need to exist at gateway runtime.
    if (!api.pluginConfig) return;

    if (!api.pluginConfig.backendUrl) {
      throw new Error("fine-tools plugin requires backendUrl in config");
    }
    const backendUrl = api.pluginConfig.backendUrl;

    for (const def of TOOL_DEFINITIONS) {
      api.registerTool({
        name: def.name,
        label: def.label,
        description: def.description,
        parameters: def.parameters,

        async execute(_toolCallId: string, params: Record<string, unknown>) {
          const userId = process.env.USER_ID;
          if (!userId) throw new Error("USER_ID env var is not set");

          const res = await fetch(`${backendUrl}/api/internal/tools/invoke`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ app: def.app, action: def.action, params, userId }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error ?? "Tool execution failed");
          }

          const data = await res.json();
          return {
            content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
          };
        },
      });
    }
  },
};

export default plugin;
