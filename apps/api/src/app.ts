import http from "node:http";
import express from "express";
import { cors } from "./middleware/cors.js";
import { auth } from "./middleware/auth.js";
import { requestLogger } from "./middleware/request-logger.js";
import { connectionsRouter } from "./modules/connections/index.js";
import toolsRouter from "./modules/tools/tools.router.js";
import authRouter from "./modules/auth/auth.router.js";
import sessionsRouter from "./modules/sessions/sessions.router.js";
import appConfig from "./config.js";
import logger from "./lib/logger.js";
import { ocToken, ensureAgent } from "./modules/openclaw/openclaw.service.js";
import { getEnabled } from "./integrations.config.js";

const log = logger.child({ src: "app" });

/** Ensure user has an OC agent registered in the runtime config. */
function ensureSessionAndAgent(req: express.Request, _res: express.Response, next: express.NextFunction) {
  if (req.auth?.userId) ensureAgent(req.auth.userId);
  next();
}

/** Inject agent ID header so OC routes to the user's agent. */
function injectAgentHeader(req: express.Request, _res: express.Response, next: express.NextFunction) {
  if (req.auth?.userId) {
    req.headers["x-openclaw-agent-id"] = req.auth.userId;
  }
  next();
}

/** Raw reverse proxy to OpenClaw gateway. */
function fcProxy(req: express.Request, res: express.Response) {
  const proxy = http.request(
    {
      hostname: "127.0.0.1",
      port: appConfig.fcPort,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, authorization: `Bearer ${ocToken()}` },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode!, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  req.pipe(proxy);
  proxy.on("error", (err) => {
    log.error({ err }, "FC proxy error");
    if (!res.headersSent) {
      res.status(502).json({ error: "FC unavailable" });
    }
  });
}

export function createApp() {
  const app = express();

  // Raw proxy to OC — auth + agent routing + ensureSession, before json parsing
  app.all("/v1/{*path}", cors, ...auth, ensureSessionAndAgent, injectAgentHeader, fcProxy);

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
      }))
    );
  });

  app.use("/api/internal/tools", toolsRouter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(auth);

  app.use("/api/sessions", sessionsRouter);
  app.use("/api/connections", connectionsRouter);
  app.use("/api/auth", authRouter);

  return app;
}
