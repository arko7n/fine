import { Router } from "express";
import { catchAsync } from "../../lib/errors.js";
import logger from "../../lib/logger.js";
import {
  getConnection,
  getConnections,
  removeConnection,
} from "./connection-store.js";
import { getProvider, hasProvider } from "./provider-registry.js";
import { pipedreamHandler } from "./providers/pipedream.handler.js";

const log = logger.child({ src: "connections.router" });
const router = Router();

/** GET /api/connections — list all connections for the authenticated user */
router.get(
  "/",
  catchAsync(async (req, res) => {
    if (!req.auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const connections = await getConnections(req.auth.userId);
    res.json(connections);
  })
);

/** POST /api/connections/:provider/connect — start a connect flow */
router.post(
  "/:provider/connect",
  catchAsync(async (req, res) => {
    if (!req.auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const provider = req.params.provider as string;
    const handler = getProvider(provider) ?? pipedreamHandler;
    const result = await handler.initiateConnect(req.auth.userId, req.body);
    res.json(result);
  })
);

/** POST /api/connections/:provider/callback — handle callback after user connects */
router.post(
  "/:provider/callback",
  catchAsync(async (req, res) => {
    if (!req.auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const provider = req.params.provider as string;
    const handler = getProvider(provider) ?? pipedreamHandler;

    // For Pipedream fallback, include the provider in the payload
    const payload = hasProvider(provider)
      ? req.body
      : { ...req.body, provider };

    const connection = await handler.handleCallback(req.auth.userId, payload);
    res.json(connection);
  })
);

/** DELETE /api/connections/:id — disconnect */
router.delete(
  "/:id",
  catchAsync(async (req, res) => {
    if (!req.auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const id = req.params.id as string;

    const connection = await getConnection(id);
    if (!connection) {
      res.status(404).json({ error: "Connection not found" });
      return;
    }
    if (connection.body.userId !== req.auth.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const handler = getProvider(connection.body.provider) ?? pipedreamHandler;
    if (handler.disconnect) {
      await handler.disconnect(id);
    } else {
      await removeConnection(id);
    }

    res.json({ ok: true });
  })
);

export default router;
