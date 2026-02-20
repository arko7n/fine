import http from "node:http";
import express from "express";
import { cors } from "./middleware/cors.js";
import { auth } from "./middleware/auth.js";
import { requestLogger } from "./middleware/request-logger.js";
import { connectionsRouter } from "./modules/connections/index.js";
import toolsRouter from "./modules/tools/tools.router.js";
import pipedreamRouter from "./modules/pipedream/pipedream.router.js";
import sessionsRouter from "./modules/sessions/sessions.router.js";
import { provisionRouter, meRouter } from "./modules/provision/provision.router.js";
import appConfig from "./config.js";
import logger from "./lib/logger.js";
import { ocToken } from "./modules/openclaw/openclaw.service.js";
import { getEnabled } from "./integrations.config.js";
import { getTaskEndpoint } from "./modules/provision/provision.service.js";

const log = logger.child({ src: "app" });
const isPerUserTask = !!process.env.USER_ID;

/** Pipe req/res to a target host:port, injecting OC auth token. */
function proxyTo(
  req: express.Request,
  res: express.Response,
  hostname: string,
  port: number,
  extraHeaders?: Record<string, string>,
) {
  const headers = { ...req.headers, authorization: `Bearer ${ocToken()}`, ...extraHeaders };
  const proxy = http.request(
    { hostname, port, path: req.originalUrl, method: req.method, headers: headers as http.OutgoingHttpHeaders },
    (proxyRes) => { res.writeHead(proxyRes.statusCode!, proxyRes.headers); proxyRes.pipe(res); },
  );
  req.pipe(proxy);
  proxy.on("error", (err) => {
    log.error({ err, hostname, port }, "Proxy error");
    if (!res.headersSent) res.status(502).json({ error: "Upstream unavailable" });
  });
}

/**
 * Proxy to user's ECS task, or fall back to local OC when not on ECS.
 */
function userTaskProxy(req: express.Request, res: express.Response) {
  const userId = req.auth?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  // Per-user task or local dev: proxy to local OC gateway
  if (appConfig.useLocalBackend || isPerUserTask) {
    proxyTo(req, res, "127.0.0.1", appConfig.fcPort);
    return;
  }

  // ECS: resolve user's task endpoint
  getTaskEndpoint(userId).then((endpoint) => {
    if (!endpoint || endpoint.provisionStatus !== "running") {
      res.status(503).json({ error: "Task not running", provisionStatus: endpoint?.provisionStatus ?? "stopped" });
      return;
    }
    proxyTo(req, res, endpoint.ip, endpoint.port);
  }).catch((err) => {
    log.error({ err, userId }, "Failed to resolve task endpoint");
    if (!res.headersSent) res.status(500).json({ error: "Failed to resolve task endpoint" });
  });
}

export function createApp() {
  const app = express();

  // Raw proxy to user's OC task — auth, before json parsing
  app.all("/v1/{*path}", cors, ...auth, userTaskProxy);

  app.use(express.json({ limit: "1mb" }));
  app.use(cors);
  app.use(requestLogger);

  // Pre-auth routes
  app.get("/api/integrations", (_req, res) => {
    res.json(
      getEnabled().map(({ id, label, description, icon, provider }) => ({
        id,
        label,
        description,
        icon,
        provider,
      })),
    );
  });

  app.use("/api/pipedream", pipedreamRouter);
  app.use("/api/internal/tools", toolsRouter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(auth);

  // Sessions: served locally (per-user task or local dev) or proxied to user's ECS task
  app.use("/api/sessions", (appConfig.useLocalBackend || isPerUserTask) ? sessionsRouter : userTaskProxy);

  // Control plane — served directly
  app.use("/api/provision", provisionRouter);
  app.use("/api/me", meRouter);
  app.use("/api/connections", connectionsRouter);

  return app;
}
