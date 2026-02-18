import express from "express";
import { cors } from "./middleware/cors.js";
import { auth } from "./middleware/auth.js";
import { requestLogger } from "./middleware/request-logger.js";
import { isHealthy } from "./modules/openclaw/openclaw.service.js";
import threadRouter from "./modules/threads/threads.router.js";
import chatRouter from "./modules/chat/chat.router.js";
import { connectionsRouter } from "./modules/connections/index.js";
import toolsRouter from "./modules/tools/tools.router.js";
import authRouter from "./modules/auth/auth.router.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cors);
  app.use(requestLogger);

  // Pre-auth routes
  app.use("/api/internal/tools", toolsRouter);

  app.get("/health", (_req, res) => {
    if (!isHealthy()) {
      res.status(503).json({ status: "unhealthy" });
      return;
    }
    res.json({ status: "ok" });
  });

  app.use(auth);

  app.use("/api/threads", threadRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/connections", connectionsRouter);
  app.use("/api/auth", authRouter);

  return app;
}
