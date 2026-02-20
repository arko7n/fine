import logger from "../../lib/logger.js";

const log = logger.child({ src: "tool-registry" });

export type ToolHandler = (params: Record<string, unknown>, userId?: string) => Promise<unknown>;

const registry = new Map<string, Map<string, ToolHandler>>();

export function registerToolHandler(app: string, action: string, handler: ToolHandler) {
  let appHandlers = registry.get(app);
  if (!appHandlers) {
    appHandlers = new Map();
    registry.set(app, appHandlers);
  }
  appHandlers.set(action, handler);
  log.debug({ app, action }, "Registered tool handler");
}

export function getToolHandler(app: string, action: string): ToolHandler | undefined {
  return registry.get(app)?.get(action);
}
