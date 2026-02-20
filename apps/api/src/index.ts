import "./env.js";

import http from "node:http";
import logger from "./lib/logger.js";
import appConfig from "./config.js";
import { createApp } from "./app.js";
import { startOpenClaw, stopOpenClaw } from "./modules/openclaw/openclaw.service.js";

const log = logger.child({ src: "index" });

async function main() {
  log.info("Starting OpenClaw gateway...");
  await startOpenClaw();
  log.info("OpenClaw gateway ready.");

  const app = createApp();
  const server = http.createServer(app);

  server.listen(appConfig.port, () => {
    log.info(`Fine backend listening on http://localhost:${appConfig.port}`);
  });
}

process.on("SIGTERM", () => { stopOpenClaw(); process.exit(0); });
process.on("SIGINT", () => { stopOpenClaw(); process.exit(0); });

main();
