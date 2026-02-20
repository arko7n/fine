import { Router } from "express";
import logger from "../../lib/logger.js";
import { getToolHandler } from "./tool-registry.js";
import { INTEGRATIONS } from "../../integrations.config.js";

// Conditionally import handlers based on integration config
if (INTEGRATIONS.find((i) => i.id === "plaid")?.enabled) {
  import("./handlers/plaid.js");
}

const log = logger.child({ src: "tools.router" });
const router = Router();

router.post("/invoke", async (req, res) => {
  const { app, action, params, userId } = req.body as {
    app?: string;
    action?: string;
    params?: Record<string, unknown>;
    userId?: string;
  };

  if (!app || !action) {
    res.status(400).json({ error: "app and action are required" });
    return;
  }

  const handler = getToolHandler(app, action);
  if (!handler) {
    res.status(404).json({ error: `Unknown tool: ${app}/${action}` });
    return;
  }

  try {
    const result = await handler(params ?? {}, userId);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    log.error({ app, action, err }, "Tool execution error");
    res.status(500).json({ error: message });
  }
});

export default router;
