import "./env.js";

import http from "node:http";
import logger from "./lib/logger.js";
import appConfig from "./config.js";
import { createApp } from "./app.js";
import { startOpenClaw, stopOpenClaw, ensureAgent } from "./modules/openclaw/openclaw.service.js";
import { discoverEcsConfig } from "./modules/provision/provision.service.js";

const log = logger.child({ src: "index" });

const USER_ID = process.env.USER_ID;

async function main() {
  await discoverEcsConfig();

  log.info("Starting OpenClaw gateway...");
  await startOpenClaw();
  log.info("OpenClaw gateway ready.");

  if (USER_ID) {
    log.info({ userId: USER_ID }, "Per-user task mode — registering single agent");
    ensureAgent(USER_ID);
  }

  const app = createApp();
  const server = http.createServer(app);

  server.listen(appConfig.port, () => {
    log.info(`Fine backend listening on http://localhost:${appConfig.port}`);
  });
}

process.on("SIGTERM", () => { stopOpenClaw(); process.exit(0); });
process.on("SIGINT", () => { stopOpenClaw(); process.exit(0); });

main();
